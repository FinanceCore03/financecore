import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Check, Loader2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  component: () => <Login />,
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinalAnimation, setShowFinalAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !showFinalAnimation) {
      console.log("User detected, starting final animation");
      setShowFinalAnimation(true);
      
      // Delay to show the smooth animation before navigating
      const timer = setTimeout(() => {
        navigate({ to: "/", replace: true });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, navigate, showFinalAnimation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || showFinalAnimation) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      // Success is handled by the useEffect watching 'user'
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden bg-[#e0f2f1]">
      {/* Background with Ocean/Wave Image - Light and soft tones */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2000&auto=format&fit=crop")',
        }}
      >
        {/* Soft light overlay to lighten the background */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
      </div>

      {/* Login Card - Moderated border-radius and refined spacing */}
      <div className="relative z-10 w-full max-w-[440px] mx-4 bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 md:p-12 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        
        {/* Final Success Animation Overlay */}
        {showFinalAnimation && (
          <div className="absolute inset-0 z-20 bg-white rounded-[24px] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-[#40E0D0]/20 rounded-full animate-ping duration-1000" />
              <div className="relative bg-white p-4 rounded-full shadow-lg border border-[#40E0D0]/10">
                <BarChart3 className="text-[#40E0D0] w-12 h-12" />
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-[#40E0D0] font-bold text-xl">Finance Core</span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#40E0D0] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-[#40E0D0] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-[#40E0D0] rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Header - Refined typography */}
        <div className="text-center mb-8 w-full">
          <h1 className="text-[28px] font-bold text-[#333] leading-tight mb-2">
            Olá, Bem Vindo ao Finance Core
          </h1>
          <p className="text-gray-400 text-[14px]">
            Entre para acessar sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 text-[13px] p-3 rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[14px] font-medium text-[#555] ml-0.5">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="Ex: seuemail@email.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[50px] pl-11 pr-4 bg-[#fcfcfc] border border-gray-100 rounded-xl focus:outline-none focus:border-[#40E0D0]/50 transition-all text-gray-700 placeholder:text-gray-300 text-[14px]"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[14px] font-medium text-[#555] ml-0.5">
              Senha
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[50px] pl-11 pr-4 bg-[#fcfcfc] border border-gray-100 rounded-xl focus:outline-none focus:border-[#40E0D0]/50 transition-all text-gray-700 placeholder:text-gray-300 text-[14px]"
                required
              />
            </div>
          </div>

          {/* Options Line */}
          <div className="flex items-center justify-between text-[12px]">
            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="peer appearance-none w-4 h-4 rounded border border-gray-200 bg-white checked:bg-[#40E0D0] checked:border-[#40E0D0] transition-all"
                />
                <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span>Mostrar senha</span>
            </label>
            <a href="#" className="text-[#40E0D0] font-medium hover:underline">
              Esqueci minha senha?
            </a>
          </div>

          {/* Submit Button - Turquoise color with subtle shadow */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || showFinalAnimation}
              className="w-full h-[52px] bg-[#40E0D0] hover:bg-[#36c7ba] text-white font-semibold text-[16px] rounded-xl shadow-[0_4px_12px_rgba(64,224,208,0.2)] transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Entrando...</span>
                </div>
              ) : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
