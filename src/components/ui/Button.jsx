import React from "react";
import Link from "next/link";

function Button({
  variant = "primary",
  children,
  href,
  as = "button",
  className = "",
  ...props
}) {

  const baseClass =
    "inline-flex items-center justify-center px-s24 py-s8 h-fit rounded-r40 font-medium transition-all duration-300 hover:cursor-pointer";

  const variants = {

    primary:
      "bg-primary-main text-white hover:bg-primary-light",

    secondary:
      "bg-secondary-dark text-white hover:opacity-90",

    outline:
      "border border-primary-main text-primary-main hover:bg-primary-main hover:text-white",

  };

  const allClasses = `
    ${baseClass}
    ${variants[variant] || variants.primary}
    ${className}
  `;

  if (as === "link" && href) {
    return (
      <Link
        href={href}
        className={allClasses}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={allClasses}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;