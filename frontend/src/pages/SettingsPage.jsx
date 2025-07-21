import { THEMES, DARK_THEMES, THEME_DESCRIPTIONS } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Moon, Sun, Palette } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's your new dark theme? 🌙", isSent: false },
  { id: 2, content: "It looks amazing! Perfect for late night coding 💻", isSent: true },
  { id: 3, content: "The gradients and animations are so smooth! ✨", isSent: false },
];

const SettingsPage = () => {
  const { theme, setTheme, isDarkTheme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 pt-20 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold gradient-text">Theme Settings</h1>
            </div>
            <p className="text-base-content/70">Customize your chat experience with beautiful themes</p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={toggleTheme}
              className="btn btn-outline gap-2 animate-scale-in"
            >
              {isDarkTheme() ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Switch to {isDarkTheme() ? "Light" : "Dark"} Mode
            </button>
          </div>

          {/* Dark Themes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Dark Themes</h2>
              <span className="badge badge-primary">Recommended</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {THEMES.filter(t => DARK_THEMES.includes(t)).map((t) => (
                <ThemeCard key={t} theme={t} currentTheme={theme} setTheme={setTheme} />
              ))}
            </div>
          </div>

          {/* Light Themes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-semibold">Light Themes</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {THEMES.filter(t => !DARK_THEMES.includes(t)).map((t) => (
                <ThemeCard key={t} theme={t} currentTheme={theme} setTheme={setTheme} />
              ))}
            </div>
          </div>

          {/* Enhanced Preview Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span>Live Preview</span>
              <span className="badge badge-ghost">Real-time</span>
            </h2>
            <div className="card glass-effect shadow-xl animate-fade-in">
              <div className="card-body p-6">
                <div className="max-w-2xl mx-auto">
                  {/* Enhanced Mock Chat UI */}
                  <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden border border-base-300/20">
                    {/* Chat Header with online status */}
                    <div className="px-6 py-4 bg-base-200/50 backdrop-blur-sm border-b border-base-300/20">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-content font-bold text-lg shadow-lg">
                            A
                          </div>
                          <div className="online-indicator absolute -bottom-0.5 -right-0.5"></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">Alex Chen</h3>
                          <p className="text-sm text-success flex items-center gap-1">
                            <span className="w-2 h-2 bg-success rounded-full"></span>
                            Online now
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Chat Messages */}
                    <div className="p-6 space-y-6 min-h-[300px] max-h-[300px] overflow-y-auto bg-gradient-to-b from-base-100/50 to-base-100">
                      {PREVIEW_MESSAGES.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"} animate-slide-up`}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-end gap-2 max-w-[85%]">
                            {!message.isSent && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-info flex items-center justify-center text-white font-semibold text-sm">
                                A
                              </div>
                            )}
                            <div>
                              <div
                                className={`
                                  rounded-2xl p-4 shadow-lg transition-all duration-200 hover:shadow-xl
                                  ${message.isSent 
                                    ? "bg-gradient-to-r from-primary to-primary-focus text-primary-content shadow-primary/25" 
                                    : "bg-base-200/80 backdrop-blur-sm border border-base-300/30"
                                  }
                                `}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 ${message.isSent ? "justify-end" : "justify-start"}`}>
                                <p className="text-xs text-base-content/60">
                                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {message.isSent && (
                                  <div className="flex gap-0.5">
                                    <div className="w-1 h-1 bg-primary/60 rounded-full"></div>
                                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {message.isSent && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                                Y
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced Chat Input */}
                    <div className="p-4 border-t border-base-300/20 bg-base-200/30 backdrop-blur-sm">
                      <div className="flex gap-3 items-end">
                        <input
                          type="text"
                          className="input flex-1 text-sm h-12 bg-base-100/50 border-base-300/30 focus:border-primary/50 transition-all duration-200"
                          placeholder="Type your message..."
                          value="This theme looks incredible! ✨"
                          readOnly
                        />
                        <button className="btn btn-primary h-12 px-6 gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200">
                          <Send size={18} />
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Theme Card Component
const ThemeCard = ({ theme, currentTheme, setTheme }) => {
  const isSelected = currentTheme === theme;
  const isDark = DARK_THEMES.includes(theme);
  const description = THEME_DESCRIPTIONS[theme];

  return (
    <button
      className={`
        group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200
        ${isSelected 
          ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20 scale-105" 
          : "bg-base-200/50 border border-base-300/30 hover:bg-base-200 hover:border-primary/30 hover:scale-102"
        }
      `}
      onClick={() => setTheme(theme)}
    >
      {/* Theme preview */}
      <div className="relative w-full h-12 rounded-lg overflow-hidden shadow-md" data-theme={theme}>
        <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-1">
          <div className="rounded bg-primary shadow-sm"></div>
          <div className="rounded bg-secondary shadow-sm"></div>
          <div className="rounded bg-accent shadow-sm"></div>
          <div className="rounded bg-neutral shadow-sm"></div>
        </div>
        {isDark && (
          <div className="absolute top-1 right-1">
            <Moon className="w-3 h-3 text-base-content/70" />
          </div>
        )}
      </div>
      
      {/* Theme name and description */}
      <div className="text-center">
        <span className={`text-sm font-medium block ${isSelected ? "text-primary" : "text-base-content"}`}>
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </span>
        {description && (
          <span className="text-xs text-base-content/60 block mt-1">
            {description}
          </span>
        )}
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
          <svg className="w-3 h-3 text-primary-content" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default SettingsPage;
