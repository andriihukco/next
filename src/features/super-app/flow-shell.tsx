import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import { Input } from "../../components/ui/input";
import { MaterialIcon } from "../../components/ui/material-icon";
import { exitTransition, spring } from "../../lib/motion";

/**
 * Shared frame for every service flow. Each flow owns its step state and
 * passes the step labels here. The stepper, back action, footer, and step
 * transition are the same in all flows (DESIGN.md §7).
 *
 * `current === steps.length` is the result screen: the stepper and footer
 * hide, and the flow renders its own closing content.
 */
export type FlowShellProps = {
  title: string;
  steps: readonly string[];
  current: number;
  backLabel: string;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Text that says why the primary action is disabled. */
  nextHint?: string;
  summary?: ReactNode;
  children: ReactNode;
};

export function FlowShell({
  title,
  steps,
  current,
  backLabel,
  onBack,
  onNext,
  nextLabel = "Далі",
  nextDisabled = false,
  nextHint,
  summary,
  children,
}: FlowShellProps) {
  const done = current >= steps.length;
  return (
    <div className="flow">
      <header className="flow-header">
        <button type="button" className="flow-back" onClick={onBack}>
          <MaterialIcon name="chevron_left" size={24} />
          <span>{backLabel}</span>
        </button>
        <h3 className="flow-title">{title}</h3>
        <span className="flow-demo">Демо</span>
      </header>

      {!done && (
        <ol className="flow-steps" aria-label="Кроки замовлення">
          {steps.map((label, index) => (
            <li
              key={label}
              className={`flow-step-label${index < current ? " is-complete" : ""}`}
              aria-current={index === current ? "step" : undefined}
            >
              <span className="flow-step-dot" aria-hidden="true">
                {index < current ? <MaterialIcon name="check" size={14} /> : index + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="flow-body">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            className="flow-step"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16, transition: exitTransition }}
            transition={spring.default}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {!done && (
        <footer className="flow-footer">
          {summary && <div className="flow-summary">{summary}</div>}
          <div className="flow-actions">
            {nextDisabled && nextHint && (
              <p className="flow-hint" role="status">
                {nextHint}
              </p>
            )}
            {onNext && (
              <Button
                type="button"
                size="lg"
                className="flow-next"
                disabled={nextDisabled}
                onClick={onNext}
              >
                {nextLabel}
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

/** A selectable row for a store, doctor, plan, film, or class. */
export function FlowOption({
  title,
  subtitle,
  icon,
  selected,
  disabled,
  trailing,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  selected: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="flow-option"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {icon && (
        <span className="flow-option-icon" aria-hidden="true">
          <MaterialIcon name={icon} size={22} filled={selected} />
        </span>
      )}
      <span className="flow-option-text">
        <span className="flow-option-title">{title}</span>
        {subtitle && <span className="flow-option-subtitle">{subtitle}</span>}
      </span>
      {trailing}
      {selected && (
        <MaterialIcon name="check_circle" size={20} filled className="flow-option-check" />
      )}
    </button>
  );
}

/** Minus, count, plus. Each button is labeled for screen readers. */
export function QuantityStepper({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flow-stepper" role="group" aria-label={label}>
      <IconButton
        label={`Зменшити: ${label}`}
        showTooltip={false}
        variant="outline"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <MaterialIcon name="remove" size={18} />
      </IconButton>
      <span className="flow-stepper-value" aria-live="polite">
        {value}
      </span>
      <IconButton
        label={`Збільшити: ${label}`}
        showTooltip={false}
        variant="outline"
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
      >
        <MaterialIcon name="add" size={18} />
      </IconButton>
    </div>
  );
}

/** A labeled text field. Inputs keep 16px so iOS does not zoom (DESIGN.md §3). */
export function FlowField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "tel";
  placeholder?: string;
  inputMode?: "text" | "tel" | "numeric";
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flow-field">
      <span className="flow-field-label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

/** The result screen shown after a flow's last step. Nothing is sent. */
export function FlowResult({
  icon,
  title,
  children,
  onClose,
  closeLabel,
}: {
  icon: string;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <section className="flow-result" role="status" aria-live="polite">
      <span className="flow-result-icon" aria-hidden="true">
        <MaterialIcon name={icon} size={32} filled />
      </span>
      <h4 className="flow-result-title">{title}</h4>
      <div className="flow-result-body">{children}</div>
      <p className="flow-result-note">Це демо. Нічого не надіслано.</p>
      <Button type="button" size="lg" className="flow-next" onClick={onClose}>
        {closeLabel}
      </Button>
    </section>
  );
}
