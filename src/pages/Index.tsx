import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => { setTheme('light'); }, [setTheme]);

  return (
    <div className="h-screen w-full flex items-center justify-center p-0 bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 overflow-hidden">
      <div className="max-w-5xl w-full mx-auto flex flex-col justify-center items-center h-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-max h-max mt-8 rounded-full flex items-center justify-center shadow bg-white/80 dark:bg-gray-900/80 p-1">
            <img src="public/flogo.png" alt="Wheely Logo" className="h-12 w-auto" />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 font-inter tracking-tight"
          >
            Welcome to <span className="text-orange-500">Wheely</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg md:text-md text-gray-500 dark:text-gray-200 mb-6 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            An intelligent assistant built to simplify workflows, answer queries, and empower teams
            across sales, service, and inventory in the tyre manufacturing industry.
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button 
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg focus:ring-4 focus:ring-orange-300 transition-all duration-200 h-12 text-base"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              variant="outline"
              size="lg"
              className="border-2 border-orange-500 text-orange-600 bg-white dark:bg-gray-900 px-6 py-3 rounded-xl font-semibold shadow-md focus:ring-4 focus:ring-orange-200 transition-all duration-200 h-12 text-base"
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto px-2">
          {/* Card 1 */}
          <div className="text-center p-4 bg-white/90 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-300 dark:from-orange-900 dark:to-orange-700 rounded-lg flex items-center justify-center mx-auto mb-3 shadow">
              <MessageSquare className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">AI-Powered Query Support</h3>
            <p className="text-gray-500 dark:text-gray-300 text-sm font-normal">
              Ask natural questions about product availability, claim status, or sales.
            </p>
          </div>

          {/* Card 2 */}
          <div className="text-center p-4 bg-white/90 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-300 dark:from-purple-900 dark:to-purple-700 rounded-lg flex items-center justify-center mx-auto mb-3 shadow">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Role-Based Insights for Dealers & Sales</h3>
            <p className="text-gray-500 dark:text-gray-300 text-sm font-normal">
              Whether you're a dealer, sales rep, or admin — get the right data at the right time.
            </p>
          </div>

          {/* Card 3 */}
          <div className="text-center p-4 bg-white/90 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-pink-300 dark:from-pink-900 dark:to-pink-700 rounded-lg flex items-center justify-center mx-auto mb-3 shadow">
              <Zap className="h-6 w-6 text-pink-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Instant Insights. Always On Time.</h3>
            <p className="text-gray-500 dark:text-gray-300 text-sm font-normal">
              Get answers in under 2 seconds. Wheely responds fast — boosting your productivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
