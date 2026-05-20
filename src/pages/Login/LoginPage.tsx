import { useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShieldCheck, Mail, Lock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useUiStore } from "@/store/slices/ui";
import { APP_CONFIG } from "@/config/app.config";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pushToast = useUiStore((s) => s.pushToast);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: "admin@apea.local", password: "" },
  });

  if (!isLoading && isAuthenticated) {
    const dest = (location.state as { from?: string } | null)?.from || "/dashboard";
    return <Navigate to={dest} replace />;
  }

  const onSubmit = async (values: LoginForm) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      pushToast({ title: "Welcome back", variant: "success" });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setSubmitError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-text">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-semibold">{APP_CONFIG.name}</span>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md"
        >
          <div className="card p-6 md:p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-text">Sign in</h1>
              <p className="mt-1 text-sm text-subtext">{APP_CONFIG.fullName}</p>
            </div>
            {submitError && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Invalid email" },
                })}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register("password", { required: "Password is required" })}
              />
              <Button type="submit" isLoading={isSubmitting} fullWidth>
                Sign in
              </Button>
            </form>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-subtext">
              <p className="font-medium text-text">Default credentials (dev)</p>
              <p className="mt-1">
                <span className="font-mono">admin@apea.local</span> /{" "}
                <span className="font-mono">Admin@123</span>
              </p>
              <p className="mt-1 text-[11px]">Change after first login. See README for details.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
