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
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.2, // controls delay between each card
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <img
          src="/orange_logo.png"
          alt="Wheely Logo"
          className="h-8 sm:h-8 md:h-12 lg:h-12 w-auto object-contain"
        />

      </div>

      <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="px-4 sm:px-8 md:px-12 lg:px-24 max-w-[1200px] w-full mx-auto flex flex-col justify-center items-center py-8 sm:py-10 md:py-16">
          {/* Header Section */}
          {/* Header Section */}
          <div className="mt-4 sm:mt-6 mb-4 sm:mb-10 w-full">
            {/* Logo aligned to left */}
            <div className="mb-6 w-full flex justify-start">
            </div>

            {/* Headline & Subtext centered */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center text-xl sm:text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-3 tracking-tight"
            >
              Welcome to{" "}
              <span className="inline-flex items-center gap-2">
                <span className="text-orange-500">
                  Wheely
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-center text-sm sm:text-base md:text-md text-gray-500 dark:text-gray-200 mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed font-medium"
            >
              Your AI assistant for smarter sales, faster service, and effortless inventory management — built for the tyre industry.
            </motion.p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mt-4 sm:mt-6 mb-8 sm:mb-12 w-full">
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg focus:ring-4 focus:ring-orange-300 transition-all duration-200 h-12 text-base w-full sm:w-auto flex items-center justify-center"
              >
                Sign in
                <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
              </Button>

              <Button
                onClick={() => navigate('/signup')}
                size="lg"
                className="border-2 border-orange-500 text-orange-600 hover:bg-white-800 bg-white px-6 py-3 rounded-xl font-semibold shadow-md focus:ring-4 focus:ring-orange-200 transition-all duration-200 h-12 text-base w-full sm:w-auto"
              >
                Register
              </Button>
            </div>
          </div>

          {/* Feature Cards Section */}
          {/* Feature Cards Section */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  when: "beforeChildren",
                  staggerChildren: 0.1, // all at once, or reduce this for slight overlap
                },
              },
            }}
          >
            {[ // Your card data
              {
                icon: <MessageSquare className="h-6 w-6 text-orange-500" />,
                color: "from-orange-100 to-orange-300 dark:from-orange-900 dark:to-orange-700",
                title: "AI-Powered Query Support",
                desc: `Just ask — Wheely understands queries like “What’s my sales today?” or “Are SKUs available?”`
              },
              {
                icon: <Users className="h-6 w-6 text-purple-500" />,
                color: "from-purple-100 to-purple-300 dark:from-purple-900 dark:to-purple-700",
                title: "Role-Based Insights for Dealers & Sales",
                desc: `Dealers, sales reps, or admins — Wheely gives you the insights that matter, when they matter.`
              },
              {
                icon: <Zap className="h-6 w-6 text-pink-500" />,
                color: "from-pink-100 to-pink-300 dark:from-pink-900 dark:to-pink-700",
                title: "Instant Insights. Always On Time.",
                desc: `No waiting. Wheely replies instantly so you can make faster decisions.`
              }
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" } }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="text-center p-5 sm:p-6 min-h-[180px] sm:min-h-[200px] bg-white/90 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center mx-auto mb-3 shadow`}>
                  {card.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-normal">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </>
  );
}

export default Index;
