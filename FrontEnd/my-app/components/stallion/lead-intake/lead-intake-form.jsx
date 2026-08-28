"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  Building2,
  Target,
  ArrowLeft,
  ArrowRight,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/stallion/lead-intake/progress-indicator";
import { StepContact } from "@/components/stallion/lead-intake/steps/step-contact";
import { StepBusiness } from "@/components/stallion/lead-intake/steps/step-business";
import { StepBant } from "@/components/stallion/lead-intake/steps/step-bant";
import { useAdAttribution } from "@/lib/use-ad-attribution";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import {
  stepContactSchema,
  stepBusinessSchema,
  stepBantSchema,
  leadSchema,
} from "@/lib/validations/lead";

function buildLeadFormData(values, briefFile) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (key === "attribution") {
      formData.append("attribution", JSON.stringify(value ?? {}));
      continue;
    }
    if (value === undefined || value === null) continue;
    formData.append(key, String(value));
  }
  if (briefFile) formData.append("brief_file", briefFile);
  return formData;
}

const STEPS = [
  {
    key: "contact",
    label: "Contact",
    icon: User,
    schema: stepContactSchema,
    Component: StepContact,
  },
  {
    key: "business",
    label: "Project",
    icon: Building2,
    schema: stepBusinessSchema,
    Component: StepBusiness,
  },
  {
    key: "bant",
    label: "Details",
    icon: Target,
    schema: stepBantSchema,
    Component: StepBant,
  },
];

const DEFAULT_VALUES = {
  full_name: "",
  email: "",
  phone: "",
  role: "",
  is_decision_maker: false,
  business_type: "",
  product_type: "",
  track: "",
  budget_band: "",
  need_description: "",
  desired_launch: "",
};

export function LeadIntakeForm({ onSubmitted }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [briefFile, setBriefFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const attribution = useAdAttribution();

  const submitLead = useMutation({
    mutationFn: async ({ values, briefFile }) => {
      const formData = buildLeadFormData(values, briefFile);
      const { data } = await api.post("/api/leads", formData);
      return data;
    },  
    onSuccess: () => {
      toast.success("Got it — we'll be in touch shortly.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: async ({ value }) => {
      const payload = { ...value, attribution };
      const parsed = leadSchema.safeParse(payload);
      if (!parsed.success) return;

      await submitLead.mutateAsync(
        { values: parsed.data, briefFile },
        { onSuccess: () => onSubmitted() },
      );
    },
  });

  const step = STEPS[stepIndex];
  const StepComponent = step.Component;
  const isLastStep = stepIndex === STEPS.length - 1;

  function goNext() {
    if (isLastStep) {
      form.handleSubmit();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProgressIndicator steps={STEPS} currentStep={stepIndex} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goNext();
        }}
        className="flex min-w-0 flex-col gap-6"
      >
        <StepComponent
          form={form}
          onEditStep={setStepIndex}
          briefFile={briefFile}
          onBriefFileChange={setBriefFile}
          fileError={fileError}
          onFileErrorChange={setFileError}
        />

        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const canProceed = step.schema
              ? step.schema.safeParse(values).success
              : true;
            return (
              <div className="flex items-center gap-3 pt-1">
                {stepIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="h-11 flex-1 border-white/15 bg-transparent text-white hover:bg-white/5"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!canProceed || submitLead.isPending}
                  className="h-11 flex-1 bg-gradient-to-r from-[#65891c] to-[#7a9e2a] font-semibold text-white hover:opacity-90 disabled:opacity-40"
                >
                  {submitLead.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting...
                    </>
                  ) : isLastStep ? (
                    "Submit"
                  ) : (
                    <>
                      Next <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </form>
    </div>
  );
}

export function LeadIntakeThankYou() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#bafc0c]/15 text-[#bafc0c]">
        <PartyPopper className="size-7" />
      </div>
      <h3 className="font-heading text-xl font-bold text-white">
        You&apos;re all set.
      </h3>
      <p className="max-w-xs text-sm text-white/55">
        Thanks — a member of our team will reach out shortly to talk through
        your project.
      </p>
    </div>
  );
}
