import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Check, Loader2 } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden">
      {/* Background with Ocean/Wave Image - Switched to cool tones */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2000&auto=format&fit=crop")',
        }}
      >
        {/* Soft light overlay to highlight the card and make it look luminous */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[460px] mx-4 bg-white/95 backdrop-blur-sm rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-10 md:p-14 flex flex-col items-center">
        {/* Header - More spacing and refined typography */}
        <div className="text-center mb-10 w-full">
          <h1 className="text-[34px] font-bold text-gray-800 leading-tight tracking-tight mb-3">
            Olá, bem-vindo
          </h1>
          <p className="text-gray-400 text-[16px] font-medium">
            Entre para acessar sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-7">
          {error && (
            <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl text-center border border-red-100">
              {error}
            </div>
          )}
          
          {/* Email Field with label above */}
          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-gray-700 ml-1">
              E-mail
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-turquoise-500 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[58px] pl-12 pr-4 bg-[#f8fafc] border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#00CED1]/10 focus:border-[#00CED1]/30 transition-all text-gray-700 placeholder:text-gray-300"
                required
              />
            </div>
          </div>

          {/* Password Field with label above */}
          <div className="space-y-2">
            <label className="text-[15px] font-semibold text-gray-700 ml-1">
              Senha
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-turquoise-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[58px] pl-12 pr-4 bg-[#f8fafc] border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#00CED1]/10 focus:border-[#00CED1]/30 transition-all text-gray-700 placeholder:text-gray-300"
                required
              />
            </div>
          </div>

          {/* Options Line - Small and discreet */}
          <div className="flex items-center justify-between text-[13px] px-1">
            <label className="flex items-center gap-2 cursor-pointer group select-none text-gray-400 hover:text-gray-600 transition-colors">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="peer appearance-none w-4.5 h-4.5 rounded-md border border-gray-200 bg-white checked:bg-[#00CED1] checked:border-[#00CED1] transition-all"
                />
                <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="font-medium">Mostrar senha</span>
            </label>
            <a href="#" className="text-[#00CED1] hover:text-[#008B8B] transition-colors font-semibold">
              Esqueci minha senha?
            </a>
          </div>

          {/* Submit Button - Turquoise/Teal gradient look */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[60px] bg-[#00CED1] hover:bg-[#20B2AA] text-white font-bold text-[18px] rounded-2xl shadow-[0_10px_25px_rgba(0,206,209,0.25)] transform transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : "Entrar"}
            </button>
          </div>
        </form>

        {/* Footer padding for visual balance */}
        <div className="mt-4" />
      </div>
    </div>
  );
}
