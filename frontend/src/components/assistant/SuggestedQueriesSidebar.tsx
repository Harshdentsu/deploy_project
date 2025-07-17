import { motion } from "framer-motion";

interface SuggestedQuery {
  text: string;
  icon: string;
}

interface SuggestedQueriesSidebarProps {
  suggestedQueries: SuggestedQuery[];
  handleSuggestedQuery: (query: string) => void;
}

const SuggestedQueriesSidebar = ({
  suggestedQueries,
  handleSuggestedQuery,
}: SuggestedQueriesSidebarProps) => {
  return (
    <motion.div
      className="fixed top-24 right-8 flex flex-col items-end gap-3 bg-transparent border-0 m-0 p-0 z-50"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{ boxShadow: "none", width: "auto", overflow: "visible" }}
    >
      <motion.h3
        className="text-base font-semibold text-gray-900 dark:text-white mb-1 mr-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        Suggested Queries
      </motion.h3>

      {suggestedQueries.map((query, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.4 + index * 0.1,
            ease: "easeOut",
          }}
          onClick={() => handleSuggestedQuery(query.text)}
        >
          <div className="text-2xl text-orange-600 dark:text-orange-300"></div>
          <motion.button
            key={index}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.4 + index * 0.1,
              ease: "easeOut",
            }}
            onClick={() => handleSuggestedQuery(query.text)}
            className="w-32 h-24 sm:w-36 sm:h-24 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow hover:shadow-lg focus:ring-2 focus:ring-orange-400 transition-all text-center flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 dark:hover:bg-orange-900"
          >
            {/* Only show icon if it exists */}
            {query.icon && (
              <div className="text-2xl text-orange-600 dark:text-orange-300">
                {query.icon}
              </div>
            )}
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight text-center">
              {query.text}
            </p>
          </motion.button>

        </motion.button>


      ))}
    </motion.div>
  );
};

export default SuggestedQueriesSidebar;
