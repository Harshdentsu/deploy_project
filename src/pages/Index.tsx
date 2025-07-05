
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Users, Zap, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";
const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4 ">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="mx-auto mb-8 w-max h-max mt-27 rounded-full flex items-center justify-center">
          <img src="public/flogo.png" alt="Wheely Logo" className="h-28 w-50" />
             
          </div>
          <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}>
  <p className="text-md text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
    An intelligent assistant built to simplify workflows, answer queries, and empower teams
    across sales, service, and inventory in the tyre manufacturing industry.
  </p>
</motion.div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700
  text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 h-14"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              onClick={() => navigate('/signup')}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold transition-all duration-200 h-14"
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
      {/* Card 1 */}
      <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-200">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-6 w-6 text-gray-700" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Query Support</h3>
        <p className="text-gray-600 text-sm">
          Ask natural questions about product availability, claim status, or sales.
        </p>
      </div>

      <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-200">
      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 " />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Role-Based Insights for Dealers & Sales</h3>
            <p className="text-gray-600">Whether you're a dealer, sales rep, or admin — get the right data at the right time.</p>
          </div>

          <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-2 transition-all duration-200">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 " />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Insights. Always On Time.</h3>
            <p className="text-gray-600">Get answers in under 2 seconds.Wheely responds fast — boosting your productivity.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
