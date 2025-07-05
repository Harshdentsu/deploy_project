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
      className="w-80 bg-gray-50 dark:bg-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto p-6"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.h3
        className="text-lg font-semibold text-gray-900 dark:text-white mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        Frequently Asked Questions
      </motion.h3>

      <div className="flex-1">
        <div className="grid grid-cols-1 gap-4">
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
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left group"
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl mb-2 dark:text-white">{query.icon}</div>
              <p className="text-sm text-gray-700 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-100">
                {query.text}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SuggestedQueriesSidebar;
