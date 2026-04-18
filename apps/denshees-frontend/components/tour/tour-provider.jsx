"use client";

import { useJoyride, STATUS } from "react-joyride";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import AppPasswordModal from "./app-password-modal";

const TOUR_STORAGE_KEY = "denshees-tour-completed";
const TOTAL_STEPS = 12;

const TourContext = createContext({ startTour: () => {}, isTourActive: false });
export const useTour = () => useContext(TourContext);

const STEPS = [
  {
    target: "#tour-new-campaign-btn",
    title: "Create Your First Campaign",
    content:
      "Let's walk through creating your first email outreach campaign! Click Next to head to the campaign builder.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "#tour-create-from-scratch",
    title: "Build a Custom Campaign",
    content:
      'Click "Create from Scratch" to build a fully custom campaign — define your own messaging, timing, and follow-up sequence.',
    skipBeacon: true,
    placement: "right",
  },
  {
    target: "#title",
    title: "Campaign Title",
    content:
      'Give your campaign a clear name — something that reflects who you\'re targeting (e.g. "Q2 SaaS Outreach").',
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "#desc",
    title: "Campaign Description",
    content:
      "Describe your campaign's objective. Who are you reaching out to? What's the offer? This is for your reference only.",
    skipBeacon: true,
    placement: "top",
  },
  {
    target: "#tour-followups-slider",
    title: "Number of Follow-ups",
    content:
      "Set how many follow-up emails to send per contact. 3–5 is a sweet spot — persistent without being spammy.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "#tour-delay-slider",
    title: "Delay Between Emails",
    content:
      "Set the gap in days between each follow-up. 2–3 days keeps you top of mind while giving prospects breathing room.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "#tour-send-time",
    title: "Best Time to Send",
    content:
      "Choose when your emails go out. Morning (6AM–12PM) typically gets the highest open rates for B2B outreach.",
    skipBeacon: true,
    placement: "bottom",
    // Radix SelectContent renders in a portal outside the spotlight cutout.
    // Hiding the overlay for this step lets the dropdown items receive pointer events.
    hideOverlay: true,
  },
  {
    target: "#tour-stepper-next",
    title: "Review & Launch!",
    content:
      "Double-check your campaign settings above, then click Complete to create it. You can always tweak settings later.",
    skipBeacon: true,
    placement: "top",
  },
  {
    target: "#tour-tab-leads",
    title: "Leads Tab",
    content:
      "This is your lead list. Import contacts via CSV or add them individually. The campaign emails each lead through your sequence automatically.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "#tour-tab-crm",
    title: "CRM Board",
    content:
      "Track deal progress on a Kanban board. Move leads through custom stages as they respond — from First Contact to Closed.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "#tour-tab-builder",
    title: "Pitch Builder",
    content:
      "Write your email templates here. Use spintax like {Hello|Hi|Hey} to make every email unique — better deliverability, fewer spam flags.",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: "#tour-tab-analytics",
    title: "Analytics Dashboard",
    content:
      "Monitor opens, clicks, replies, and bounces in real time. Use this to fine-tune your timing and messaging over time.",
    skipBeacon: true,
    placement: "bottom",
  },
];

// Color tokens + behavior flags — passed as `options` prop in v3
const joyrideOptions = {
  arrowColor: "#ffffff",
  backgroundColor: "#ffffff",
  overlayColor: "rgba(0, 0, 0, 0.55)",
  primaryColor: "#000000",
  textColor: "#111827",
  zIndex: 10000,
  // No back button
  buttons: ["close", "primary"],
  // Prevent overlay clicks from closing the tour — fixes Radix portal
  // dropdowns (Select, Combobox, etc.) that render outside the spotlight
  overlayClickAction: false,
};

// CSS overrides — passed as `styles` prop in v3
const joyrideStyles = {
  tooltip: {
    borderRadius: 0,
    border: "2px solid #000000",
    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
    padding: "20px",
  },
  tooltipTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  tooltipContent: {
    fontSize: "14px",
    lineHeight: "1.6",
    padding: "0",
  },
  buttonPrimary: {
    backgroundColor: "#000000",
    borderRadius: 0,
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    padding: "8px 16px",
  },
  buttonBack: {
    backgroundColor: "transparent",
    border: "1px solid #000000",
    borderRadius: 0,
    color: "#000000",
    fontSize: "13px",
    fontWeight: "600",
    padding: "8px 16px",
    marginRight: "8px",
  },
  buttonSkip: {
    color: "#6b7280",
    fontSize: "13px",
  },
  spotlight: {
    borderRadius: 0,
    border: "2px solid #000000",
  },
  buttonClose: {
    color: "#111827",
  },
};

export function TourProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const prevPathnameRef = useRef(pathname);
  // Ref keeps the latest stepIndex readable inside effects without stale closures
  const stepIndexRef = useRef(0);
  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      setTimeout(() => {
        router.push("/campaigns");
        setTimeout(() => setRun(true), 800);
      }, 1200);
    }
  }, []);

  // Detect navigation from /campaigns/create → /campaigns/[id] after campaign creation
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    const isNowOnCampaignDetail =
      /^\/campaigns\/[^/]+$/.test(pathname) && pathname !== "/campaigns/create";
    const wasOnCreatePage = prev === "/campaigns/create";

    if (isNowOnCampaignDetail && wasOnCreatePage && stepIndexRef.current === 7) {
      setTimeout(() => {
        setStepIndex(8);
        setRun(true);
      }, 800);
    }
  }, [pathname]);

  const completeTour = useCallback(() => {
    setRun(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setShowModal(true);
  }, []);

  const handleEvent = useCallback(
    (data, controls) => {
      const { action, index, status, type } = data;

      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        completeTour();
        return;
      }

      if (type === "error:target_not_found") {
        setRun(false);
        setTimeout(() => setRun(true), 600);
        return;
      }

      if (type !== "step:after") return;

      if (action === "close") {
        completeTour();
        return;
      }

      if (action === "prev") return;

      // Moving forward — validate required fields before advancing
      switch (index) {
        case 0:
          // campaigns list → navigate to create page
          setRun(false);
          router.push("/campaigns/create");
          setTimeout(() => {
            setStepIndex(1);
            setRun(true);
          }, 800);
          break;

        case 1:
          // Template selection → click "Create from Scratch"
          setRun(false);
          document.getElementById("tour-create-from-scratch")?.click();
          setTimeout(() => {
            setStepIndex(2);
            setRun(true);
          }, 400);
          break;

        case 2: {
          // title — must not be empty
          const title = document.getElementById("title")?.value?.trim();
          if (!title) {
            toast.error("Please enter a campaign title before continuing.");
            controls.open();
            return;
          }
          setStepIndex(3);
          break;
        }

        case 3: {
          // desc — must not be empty, then advance wizard to Settings
          const desc = document.getElementById("desc")?.value?.trim();
          if (!desc) {
            toast.error("Please enter a campaign description before continuing.");
            controls.open();
            return;
          }
          setRun(false);
          document.getElementById("tour-stepper-next")?.click();
          setTimeout(() => {
            setStepIndex(4);
            setRun(true);
          }, 350);
          break;
        }

        case 6: {
          // send time — Radix SelectValue renders data-placeholder when nothing is chosen
          const noValue = document.querySelector(
            "#tour-send-time [data-placeholder]",
          );
          if (noValue) {
            toast.error("Please select a send time before continuing.");
            controls.open();
            return;
          }
          // advance wizard to Review sub-step
          setRun(false);
          document.getElementById("tour-stepper-next")?.click();
          setTimeout(() => {
            setStepIndex(7);
            setRun(true);
          }, 350);
          break;
        }

        case 7:
          // review → trigger campaign creation
          setRun(false);
          document.getElementById("tour-stepper-next")?.click();
          // useEffect detects navigation to /campaigns/[id] and advances to step 8
          break;

        case TOTAL_STEPS - 1:
          completeTour();
          break;

        default:
          setStepIndex(index + 1);
      }
    },
    [router, completeTour],
  );

  const { Tour } = useJoyride({
    continuous: true,
    run,
    stepIndex,
    steps: STEPS,
    showProgress: true,
    showSkipButton: true,
    scrollToFirstStep: true,
    options: joyrideOptions,
    styles: joyrideStyles,
    locale: {
      back: "Back",
      close: "Close",
      last: "Finish",
      next: "Next →",
      skip: "Skip tour",
    },
    onEvent: handleEvent,
  });

  const startTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setStepIndex(0);
    setShowModal(false);
    router.push("/campaigns");
    setTimeout(() => setRun(true), 800);
  }, [router]);

  return (
    <TourContext.Provider value={{ startTour, isTourActive: run }}>
      {Tour}
      {children}
      <AppPasswordModal open={showModal} onClose={() => setShowModal(false)} />
    </TourContext.Provider>
  );
}
