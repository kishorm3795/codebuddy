import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { TbLoader } from "react-icons/tb";
import InputField from "../utils/InputField";
import { apiFetch } from "../utils/apifetch";
import {
  SESSION_STORAGE_SHARELINKS_KEY,
  LOCAL_STORAGE_TOKEN_KEY,
  LOCAL_STORAGE_USERNAME_KEY,
  LOCAL_STORAGE_LOGIN_KEY,
  BACKEND_API_URL,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  LOCAL_STORAGE_GOOGLE_USER,
} from "../utils/constants";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [googleLoginError, setGoogleLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login - CodeBuddi";
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, data.username);
    localStorage.setItem(LOCAL_STORAGE_LOGIN_KEY, "true");
    localStorage.setItem(LOCAL_STORAGE_GOOGLE_USER, data.isgoogleuser);
    sessionStorage.removeItem(SESSION_STORAGE_SHARELINKS_KEY);
    navigate(window.history.length > 2 ? -1 : "/");
    location.reload();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (error || googleLoginError) {
      setError("");
      setGoogleLoginError("");
    }
  };

  const validateForm = () => {
    if (!EMAIL_REGEX.test(formData.email.trim())) {
      setError("Invalid email format");
      return false;
    }
    if (formData.password.trim().length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (!PASSWORD_REGEX.test(formData.password.trim())) {
      setError("Invalid password format");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    if (error || googleLoginError) {
      setError("");
      setGoogleLoginError("");
    }

    try {
      const response = await apiFetch(`${BACKEND_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.msg === "Email not verified") {
          setError(
            "Email is not verified. Please check your inbox or register again."
          );
        } else {
          setError(data.msg || "Invalid credentials!");
        }
        return;
      }
      handleAuthSuccess(data);
    } catch (err) {
      setError(err.message || "Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);

    if (error || googleLoginError) {
      setError("");
      setGoogleLoginError("");
    }

    try {
      const idToken = credentialResponse.credential;
      const response = await apiFetch(`${BACKEND_API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error("Google authentication failed.");
      }
      handleAuthSuccess(data);
    } catch (err) {
      setGoogleLoginError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setGoogleLoginError("Google login failed. Please try again.");
  };

  return (
    <div className="flex items-center justify-center min-h-[80dvh] bg-gray-50 dark:bg-gray-950 px-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to continue to CodeBuddi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          <InputField
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            disabled={loading}
          />

          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 cursor-pointer text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <TbLoader className="animate-spin text-xl mr-2" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400 uppercase tracking-wider">
            Or continue with
          </span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            theme="filled_black"
            shape="rectangular"
            scope="profile email"
            text="continue_with"
            useOneTap
          />
        </div>

        {googleLoginError && (
          <p className="text-red-500 text-sm text-center mt-4">
            {googleLoginError}
          </p>
        )}

        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-cyan-500 font-medium hover:text-cyan-600 transition-colors"
            >
              Sign up
            </button>
          </p>
          <p className="text-sm">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-gray-500 hover:text-cyan-500 transition-colors"
            >
              Forgot password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

