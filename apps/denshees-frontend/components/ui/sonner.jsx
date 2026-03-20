import { Toaster as Sonner } from "sonner";

const Toast = ({ ...props }) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-black group-[.toaster]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-[.toaster]:rounded-none",
          title: "group-[.toast]:text-black group-[.toast]:font-medium",
          description: "group-[.toast]:text-gray-500",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white group-[.toast]:rounded-none",
          cancelButton:
            "group-[.toast]:bg-white group-[.toast]:text-black group-[.toast]:border-black group-[.toast]:rounded-none",
          closeButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-black group-[.toast]:rounded-none group-[.toast]:border-black",
        },
      }}
      {...props}
    />
  );
};

export { Toast };
