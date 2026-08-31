<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadMilestone;
use App\Models\LeadPreview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * The dev workspace's write side for a project's client-facing delivery
 * data — steps, previews, live URL. Previously local-only (see
 * FrontEnd's lib/crm-api.js); real now, backed by lead_milestones /
 * lead_previews and a `live_url` column on leads.
 */
class ProjectController extends Controller
{
    /** Admin is unrestricted; a dev may only touch a project they're
     *  actually assigned to (the same check LeadController uses for a
     *  sales rep's own leads). */
    private function assertCanEditProject(Request $request, Lead $lead): void
    {
        $user = $request->user();

        if ($user->role === 'dev' && ! $lead->developers()->where('users.id', $user->id)->exists()) {
            abort(403, 'You are not assigned to this project.');
        }
    }

    /**
     * Re-derive done/in_progress/pending after every write — the same rule
     * as the frontend's normalizeMilestones(): the first step that isn't
     * done becomes "in progress", everything after it "pending", and
     * "done" is never touched here. This is the only place that may set
     * `status` to anything but "done" — a client request can only ever
     * ask for done/pending (the checkbox), never the derived middle state.
     */
    private function normalizeStatuses(Lead $lead): void
    {
        $foundOpen = false;

        foreach ($lead->milestones()->orderBy('position')->get() as $milestone) {
            if ($milestone->status === 'done') {
                continue;
            }

            $next = $foundOpen ? 'pending' : 'in_progress';
            $foundOpen = true;

            if ($milestone->status !== $next) {
                $milestone->status = $next;
                $milestone->save();
            }
        }
    }

    private function milestonesResponse(Lead $lead)
    {
        return response()->json(['milestones' => $lead->milestones()->orderBy('position')->get()]);
    }

    private function previewsResponse(Lead $lead)
    {
        return response()->json(['previews' => $lead->previews()->latest()->get()]);
    }

    public function storeMilestone(Request $request, Lead $lead)
    {
        $this->assertCanEditProject($request, $lead);

        $data = $request->validate([
            'label' => ['required', 'string', 'min:1', 'max:255'],
            'target_date' => ['nullable', 'date'],
        ]);

        $position = ($lead->milestones()->max('position') ?? -1) + 1;

        $lead->milestones()->create([
            'label' => $data['label'],
            'target_date' => $data['target_date'] ?? null,
            'position' => $position,
        ]);

        $this->normalizeStatuses($lead);

        return $this->milestonesResponse($lead);
    }

    /** One endpoint for rename/retarget/toggle — same reason the frontend
     *  had one function for all three: they all resolve to "change this
     *  step, then re-derive the list". `status` here only ever means the
     *  checkbox (done/pending); see normalizeStatuses(). */
    public function updateMilestone(Request $request, Lead $lead, LeadMilestone $milestone)
    {
        $this->assertCanEditProject($request, $lead);
        abort_unless($milestone->lead_id === $lead->id, 404);

        $data = $request->validate([
            'label' => ['sometimes', 'string', 'min:1', 'max:255'],
            'target_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'string', 'in:done,pending'],
        ]);

        $milestone->fill($data);
        $milestone->save();

        $this->normalizeStatuses($lead);

        return $this->milestonesResponse($lead);
    }

    public function destroyMilestone(Request $request, Lead $lead, LeadMilestone $milestone)
    {
        $this->assertCanEditProject($request, $lead);
        abort_unless($milestone->lead_id === $lead->id, 404);

        $milestone->delete();
        $this->normalizeStatuses($lead);

        return $this->milestonesResponse($lead);
    }

    /** Takes the FULL ordered id list, not a delta — a dropped request can
     *  then never leave the order half-applied. Rejects a list that
     *  doesn't match the current steps exactly, so a stale client can't
     *  silently drop one. */
    public function reorderMilestones(Request $request, Lead $lead)
    {
        $this->assertCanEditProject($request, $lead);

        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $current = $lead->milestones()->pluck('id')->sort()->values()->all();
        $sent = collect($data['ids'])->sort()->values()->all();

        if ($current !== $sent) {
            return response()->json([
                'error' => 'That reorder did not match the current steps. Reload and try again.',
            ], 422);
        }

        foreach ($data['ids'] as $position => $id) {
            LeadMilestone::where('id', $id)->update(['position' => $position]);
        }

        return $this->milestonesResponse($lead);
    }

    /**
     * A screenshot, a link, or both. The screenshot arrives as a base64
     * data URL (the frontend already downsizes/encodes it client-side —
     * see lib/image-upload.js) and is decoded to a real file here instead
     * of being stored in the database, matching the brief_file_path
     * pattern LeadController::store already uses.
     */
    public function storePreview(Request $request, Lead $lead)
    {
        $this->assertCanEditProject($request, $lead);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:500'],
            'url' => ['nullable', 'string', 'url', 'max:2048'],
            'image_data_url' => ['nullable', 'string'],
        ]);

        if (empty($data['url']) && empty($data['image_data_url'])) {
            throw ValidationException::withMessages(['url' => 'Add a screenshot or a link.']);
        }

        $imagePath = null;

        if (! empty($data['image_data_url'])) {
            if (! preg_match('/^data:image\/(png|jpe?g|webp);base64,(.+)$/', $data['image_data_url'], $matches)) {
                throw ValidationException::withMessages(['image_data_url' => 'That screenshot could not be read.']);
            }

            $extension = $matches[1] === 'jpg' ? 'jpeg' : $matches[1];
            $binary = base64_decode($matches[2]);
            $imagePath = "lead-previews/{$lead->id}-".uniqid().".{$extension}";
            Storage::disk('public')->put($imagePath, $binary);
        }

        $lead->previews()->create([
            'label' => $data['label'],
            'note' => $data['note'] ?? null,
            'url' => $data['url'] ?? null,
            'image_path' => $imagePath,
        ]);

        return $this->previewsResponse($lead);
    }

    /** Deletes the stored file too — an unshared preview must not stay
     *  reachable by anyone who kept the URL. */
    public function destroyPreview(Request $request, Lead $lead, LeadPreview $preview)
    {
        $this->assertCanEditProject($request, $lead);
        abort_unless($preview->lead_id === $lead->id, 404);

        if ($preview->image_path) {
            Storage::disk('public')->delete($preview->image_path);
        }
        $preview->delete();

        return $this->previewsResponse($lead);
    }

    /** `live_url: null` clears it — a real action with a real consequence
     *  (the client's "Your live site" card turns back off). */
    public function updateLiveUrl(Request $request, Lead $lead)
    {
        $this->assertCanEditProject($request, $lead);

        $data = $request->validate([
            'live_url' => ['nullable', 'string', 'regex:/^https?:\/\/\S+\.\S+/i', 'max:2048'],
        ]);

        $lead->live_url = $data['live_url'] ?? null;
        $lead->save();

        return response()->json(['live_url' => $lead->live_url]);
    }
}
