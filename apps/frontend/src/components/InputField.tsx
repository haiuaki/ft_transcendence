"use client"

import { themeColors } from "@/src/lib/themeColors";
import { Eye, EyeClosed } from "lucide-react";
import { ChangeEventHandler, useState } from "react";

interface InputFieldProps {
  title: string;
  placeholder?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  maxLength?: number;
  type?: string;
  disabled?: boolean;
}

export default function InputField({
  title,
  placeholder = "",
  value,
  onChange,
  maxLength,
  type = "text",
  disabled = false,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        {maxLength !== undefined && (
          <p className={`text-xs ${themeColors.textSecondary}`}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>
      <div className={`flex items-center justify-between gap-2 w-full ring-1 ring-[#dedede] focus-within:ring-black/80 rounded-md ${disabled ? "bg-black/5 cursor-not-allowed" : ""}`}>
        <input
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={onChange}
          value={value}
          type={type === "password" && !showPassword ? "password" : "text"}
          className={`w-full pl-2 py-2 outline-none text-sm bg-transparent ${disabled ? "cursor-not-allowed" : ""}`}
        />
        {type === "password" && !disabled && (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="pr-2 cursor-pointer"
            onClick={() => setShowPassword((isVisible) => !isVisible)}
          >
            {showPassword ? <Eye size={12} /> : <EyeClosed size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}
