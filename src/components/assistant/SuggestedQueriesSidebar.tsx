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
        Frequently Asked Questions
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
          className="w-48 py-3 px-3 bg-white dark:bg-white-800 border border-white-200 dark:border-white-700 rounded-xl shadow hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-all text-left group flex flex-col items-start"
        >
          <div className="text-xl mb-2 dark:text-white">{query.icon}</div>
          <p className="text-sm text-gray-700 dark:text-white font-medium">
            {query.text}
          </p>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default SuggestedQueriesSidebar;
