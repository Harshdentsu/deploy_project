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
    <motion.section
      className="w-full max-w-md mx-auto md:mx-0 md:w-[240px] lg:w-[260px] xl:w-[280px] flex flex-col items-stretch gap-4 md:gap-6 rounded-2xl bg-white/70 dark:bg-black/60 shadow-xl border border-orange-100 dark:border-neutral-800 backdrop-blur-md p-4 md:p-6 my-2 md:my-0"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.h3
        className="text-lg md:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2 md:mb-4 tracking-tight drop-shadow-sm text-center md:text-left"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <span className="bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">Suggested Queries</span>
      </motion.h3>

      <div className="flex flex-col gap-3 md:gap-5 w-full">
        {suggestedQueries.map((query, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3 + index * 0.08,
              ease: "easeOut",
            }}
            onClick={() => handleSuggestedQuery(query.value)}
            className="w-full h-20 px-4 py-3 bg-gradient-to-br from-orange-50/90 via-white/90 to-purple-50/90 dark:from-black/70 dark:via-neutral-900/80 dark:to-black/70 border border-orange-100 dark:border-neutral-800 rounded-xl shadow-md hover:shadow-xl focus:ring-2 focus:ring-orange-400 transition-all flex flex-col items-center justify-center gap-2 hover:scale-[1.04] hover:bg-orange-100/80 dark:hover:bg-neutral-900/80 cursor-pointer group mx-auto"
            style={{ boxShadow: "0 4px 16px 0 rgba(168,85,247,0.10)" }}
          >
            {query.iconImage && (
              <img
                src={query.iconImage}
                alt="icon"
                className="w-9 h-9 object-contain mb-1 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-200"
              />
            )}
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-tight text-center drop-shadow-sm">
              {query.text}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
};

export default SuggestedQueriesSidebar;
