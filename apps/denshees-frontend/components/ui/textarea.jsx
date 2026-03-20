import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-none border-2 border-black bg-white px-3 py-2 text-base text-black",
        "placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-black",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
        "transition-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
        "md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
