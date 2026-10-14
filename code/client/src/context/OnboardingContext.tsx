import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "dismissed";

export interface OnboardingDraftData {
  persona?: string;
  handle?: string;
  displayName?: string;
  accentColor?: string;
  bio?: string;
  learningTrack?: string;
  weeklyGoalHours?: number;
  seedStarterContent?: boolean;
  aiSuggestionsEnabled?: boolean;
  proactiveMilestoneAlerts?: boolean;
  dailyDigestEnabled?: boolean;
}

export interface ChecklistProgress {
  personaConfigured: boolean;
  profileCustomized: boolean;
  trackSelected: boolean;
  firstTaskCreated: boolean;
  aiAssistantExplored: boolean;
  firstNoteCreated: boolean;
  tourCompleted: boolean;
}

export interface OnboardingState {
  userId: string;
  status: OnboardingStatus;
  currentStep: number; // 1 to 5
  lastSavedAt: string;
  draft: OnboardingDraftData;
  checklist: ChecklistProgress;
  isWizardOpen: boolean;
  isTourActive: boolean;
  currentTourStep: number;
}

interface OnboardingContextValue {
  state: OnboardingState;
  openWizard: (step?: number) => void;
  closeWizard: () => void;
  saveAndExit: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  updateDraft: (data: Partial<OnboardingDraftData>) => void;
  completeOnboarding: (overrideDraft?: Partial<OnboardingDraftData>) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  updateChecklist: (key: keyof ChecklistProgress, completed: boolean) => void;
  startTour: () => void;
  endTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  setTourStep: (step: number) => void;
}

const STORAGE_PREFIX = "skillos_onboarding_";

const defaultChecklist: ChecklistProgress = {
  personaConfigured: false,
  profileCustomized: false,
  trackSelected: false,
  firstTaskCreated: false,
  aiAssistantExplored: false,
  firstNoteCreated: false,
  tourCompleted: false,
};

const defaultDraft: OnboardingDraftData = {
  persona: "Full-Stack Engineer",
  handle: "engineer",
  displayName: "Developer",
  accentColor: "amber",
  bio: "Mastering systems architecture, AI agents, and production engineering.",
  learningTrack: "Full-Stack AI Engineering",
  weeklyGoalHours: 10,
  seedStarterContent: true,
  aiSuggestionsEnabled: true,
  proactiveMilestoneAlerts: true,
  dailyDigestEnabled: true,
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user, updateUser } = useAuth();
  const userId = user?.id || "guest";

  const getStorageKey = useCallback(
    (uid: string) => `${STORAGE_PREFIX}${uid}`,
    []
  );

  const [state, setState] = useState<OnboardingState>(() => {
    const initialDisplayName =
      user?.fullName ||
      (user?.email ? user.email.split("@")[0] : "Learner");
    const initialHandle = user?.email
      ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
      : "learner";

    if (user?.id) {
      try {
        const stored = localStorage.getItem(getStorageKey(user.id));
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...parsed,
            userId: user.id,
            isWizardOpen: false, // Don't auto open modal if reloaded unless in progress
            isTourActive: false,
            currentTourStep: 0,
          };
        }
      } catch (e) {
        console.error("Error reading stored onboarding state:", e);
      }
    }

    // Default state for first-time session
    return {
      userId,
      status: "not_started",
      currentStep: 1,
      lastSavedAt: new Date().toISOString(),
      draft: {
        ...defaultDraft,
        displayName: initialDisplayName,
        handle: initialHandle,
        accentColor: user?.accentColor || "amber",
      },
      checklist: { ...defaultChecklist },
      // Auto open wizard for newly registered or first-time users
      isWizardOpen: Boolean(user && user.id),
      isTourActive: false,
      currentTourStep: 0,
    };
  });

  // Re-sync or initialize state when user changes
  useEffect(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(getStorageKey(user.id));
      if (stored) {
        const parsed = JSON.parse(stored);
        setState((prev) => ({
          ...prev,
          ...parsed,
          userId: user.id,
          // If in_progress or not_started, do not force modal unless status was not_started
          isWizardOpen: parsed.status === "not_started",
          isTourActive: false,
        }));
      } else {
        const initialDisplayName =
          user.fullName ||
          (user.email ? user.email.split("@")[0] : "Learner");
        const initialHandle = user.email
          ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
          : "learner";

        const newState: OnboardingState = {
          userId: user.id,
          status: "not_started",
          currentStep: 1,
          lastSavedAt: new Date().toISOString(),
          draft: {
            ...defaultDraft,
            displayName: initialDisplayName,
            handle: initialHandle,
            accentColor: user.accentColor || "amber",
          },
          checklist: { ...defaultChecklist },
          isWizardOpen: true,
          isTourActive: false,
          currentTourStep: 0,
        };
        setState(newState);
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(newState));
      }
    } catch (e) {
      console.error("Error synchronizing onboarding state:", e);
    }
  }, [user?.id, getStorageKey]);

  // Persist helper
  const persistState = useCallback(
    (updated: OnboardingState) => {
      if (!user?.id) return;
      try {
        const toSave = {
          userId: user.id,
          status: updated.status,
          currentStep: updated.currentStep,
          lastSavedAt: new Date().toISOString(),
          draft: updated.draft,
          checklist: updated.checklist,
        };
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(toSave));
      } catch (e) {
        console.error("Error persisting onboarding state:", e);
      }
    },
    [user?.id, getStorageKey]
  );

  const openWizard = useCallback((step?: number) => {
    setState((prev) => {
      const targetStep = step ? Math.min(Math.max(step, 1), 5) : prev.currentStep;
      return {
        ...prev,
        currentStep: targetStep,
        isWizardOpen: true,
        status: prev.status === "completed" ? "completed" : "in_progress",
      };
    });
  }, []);

  const closeWizard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isWizardOpen: false,
    }));
  }, []);

  const saveAndExit = useCallback(() => {
    setState((prev) => {
      const updated: OnboardingState = {
        ...prev,
        status: prev.status === "completed" ? "completed" : "in_progress",
        isWizardOpen: false,
        lastSavedAt: new Date().toISOString(),
      };
      persistState(updated);
      return updated;
    });
  }, [persistState]);

  const goToNextStep = useCallback(() => {
    setState((prev) => {
      const nextStep = Math.min(prev.currentStep + 1, 5);
      const updatedChecklist = { ...prev.checklist };

      if (prev.currentStep === 1) updatedChecklist.personaConfigured = true;
      if (prev.currentStep === 2) updatedChecklist.profileCustomized = true;
      if (prev.currentStep === 3) updatedChecklist.trackSelected = true;

      const updated: OnboardingState = {
        ...prev,
        currentStep: nextStep,
        status: "in_progress",
        checklist: updatedChecklist,
        lastSavedAt: new Date().toISOString(),
      };
      persistState(updated);
      return updated;
    });
  }, [persistState]);

  const goToPreviousStep = useCallback(() => {
    setState((prev) => {
      const prevStep = Math.max(prev.currentStep - 1, 1);
      const updated: OnboardingState = {
        ...prev,
        currentStep: prevStep,
        lastSavedAt: new Date().toISOString(),
      };
      persistState(updated);
      return updated;
    });
  }, [persistState]);

  const goToStep = useCallback(
    (step: number) => {
      setState((prev) => {
        const targetStep = Math.min(Math.max(step, 1), 5);
        const updated: OnboardingState = {
          ...prev,
          currentStep: targetStep,
          lastSavedAt: new Date().toISOString(),
        };
        persistState(updated);
        return updated;
      });
    },
    [persistState]
  );

  const updateDraft = useCallback(
    (data: Partial<OnboardingDraftData>) => {
      setState((prev) => {
        const updatedDraft = { ...prev.draft, ...data };
        const updated: OnboardingState = {
          ...prev,
          draft: updatedDraft,
          lastSavedAt: new Date().toISOString(),
        };
        persistState(updated);
        return updated;
      });
    },
    [persistState]
  );

  const completeOnboarding = useCallback(
    (overrideDraft?: Partial<OnboardingDraftData>) => {
      setState((prev) => {
        const finalDraft = { ...prev.draft, ...overrideDraft };
        const updatedChecklist: ChecklistProgress = {
          ...prev.checklist,
          personaConfigured: true,
          profileCustomized: true,
          trackSelected: true,
        };

        const updated: OnboardingState = {
          ...prev,
          status: "completed",
          currentStep: 5,
          draft: finalDraft,
          checklist: updatedChecklist,
          isWizardOpen: false,
          lastSavedAt: new Date().toISOString(),
        };
        persistState(updated);

        // Also sync profile fields back to AuthContext user if appropriate
        if (updateUser) {
          updateUser({
            fullName: finalDraft.displayName || user?.fullName,
            bio: finalDraft.bio || user?.bio,
            accentColor: finalDraft.accentColor || user?.accentColor,
            settings: {
              aiSuggestions: finalDraft.aiSuggestionsEnabled ?? true,
              workflowAlerts: finalDraft.proactiveMilestoneAlerts ?? true,
            },
          });
        }

        return updated;
      });
    },
    [persistState, updateUser, user]
  );

  const skipOnboarding = useCallback(() => {
    setState((prev) => {
      const updated: OnboardingState = {
        ...prev,
        status: "dismissed",
        isWizardOpen: false,
        lastSavedAt: new Date().toISOString(),
      };
      persistState(updated);
      return updated;
    });
  }, [persistState]);

  const resetOnboarding = useCallback(() => {
    if (!user?.id) return;
    const initialDisplayName =
      user.fullName || (user.email ? user.email.split("@")[0] : "Learner");
    const initialHandle = user.email
      ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
      : "learner";

    const freshState: OnboardingState = {
      userId: user.id,
      status: "not_started",
      currentStep: 1,
      lastSavedAt: new Date().toISOString(),
      draft: {
        ...defaultDraft,
        displayName: initialDisplayName,
        handle: initialHandle,
        accentColor: user.accentColor || "amber",
      },
      checklist: { ...defaultChecklist },
      isWizardOpen: true,
      isTourActive: false,
      currentTourStep: 0,
    };
    setState(freshState);
    persistState(freshState);
  }, [user, persistState]);

  const updateChecklist = useCallback(
    (key: keyof ChecklistProgress, completed: boolean) => {
      setState((prev) => {
        const updatedChecklist = { ...prev.checklist, [key]: completed };
        const updated: OnboardingState = {
          ...prev,
          checklist: updatedChecklist,
          lastSavedAt: new Date().toISOString(),
        };
        persistState(updated);
        return updated;
      });
    },
    [persistState]
  );

  const startTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTourActive: true,
      currentTourStep: 0,
      isWizardOpen: false,
    }));
  }, []);

  const endTour = useCallback(() => {
    setState((prev) => {
      const updatedChecklist = { ...prev.checklist, tourCompleted: true };
      const updated: OnboardingState = {
        ...prev,
        isTourActive: false,
        currentTourStep: 0,
        checklist: updatedChecklist,
      };
      persistState(updated);
      return updated;
    });
  }, [persistState]);

  const nextTourStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentTourStep >= 4) {
        const updatedChecklist = { ...prev.checklist, tourCompleted: true };
        const updated: OnboardingState = {
          ...prev,
          isTourActive: false,
          currentTourStep: 0,
          checklist: updatedChecklist,
        };
        persistState(updated);
        return updated;
      }
      return {
        ...prev,
        currentTourStep: prev.currentTourStep + 1,
      };
    });
  }, [persistState]);

  const prevTourStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentTourStep: Math.max(prev.currentTourStep - 1, 0),
    }));
  }, []);

  const setTourStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentTourStep: step,
    }));
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        openWizard,
        closeWizard,
        saveAndExit,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        updateDraft,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding,
        updateChecklist,
        startTour,
        endTour,
        nextTourStep,
        prevTourStep,
        setTourStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
