import { motion } from "framer-motion";

interface SuggestedQuery {
  text: string;
  value: string;
  iconImage: string;
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
     className="hidden sm:flex fixed top-[140px] right-8 z-40 flex-col items-end gap-3 border-0 m-0 p-0"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{ boxShadow: "none", width: "auto", overflow: "visible", background: "none" }}
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
          onClick={() => handleSuggestedQuery(query.value)}
          className="w-32 h-24 sm:w-36 sm:h-24 p-3 border border-gray-300 dark:border-[#3B3B45] rounded-lg shadow hover:shadow-lg focus:ring-2 focus:ring-orange-400 transition-all text-center flex flex-col items-center justify-center space-y-2"
          style={{ background: "none" }}
        >
          {/* Show image icon if present */}
          {query.iconImage && (
            <img
              src={query.iconImage}
              alt="icon"
              className="w-8 h-8 object-contain"
            />
          )}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight text-center">
            {query.text}
          </p>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default SuggestedQueriesSidebar;
