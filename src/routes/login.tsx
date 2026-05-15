import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Lock, Check } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden">
      {/* Background with Ocean/Wave Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop")',
        }}
      >
        {/* Soft overlay to highlight the card */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] mx-4 bg-white rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] p-12 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-gray-800 leading-tight">
            Olá, bem-vindo
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Entre para acessar sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[54px] pl-12 pr-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4ade80]/20 focus:border-[#4ade80]/50 transition-all text-gray-700 placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[54px] pl-12 pr-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4ade80]/20 focus:border-[#4ade80]/50 transition-all text-gray-700 placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* Options Line */}
          <div className="flex items-center justify-between text-sm px-1">
            <label className="flex items-center gap-2 cursor-pointer group select-none text-gray-500 hover:text-gray-700 transition-colors">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="peer appearance-none w-5 h-5 rounded-md border border-gray-300 bg-white checked:bg-[#4ade80] checked:border-[#4ade80] transition-all"
                />
                <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span>Mostrar senha</span>
            </label>
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors font-medium">
              Esqueci minha senha?
            </a>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => window.location.href = "/"}
              className="w-full h-[54px] bg-[#4ade80] hover:bg-[#3ecb70] text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(74,222,128,0.3)] transform transition-all active:scale-[0.98] cursor-pointer"
            >
              Entrar
            </button>
          </div>
        </form>

        {/* Padding for harmony */}
        <div className="mt-4" />
      </div>
    </div>
  );
}
