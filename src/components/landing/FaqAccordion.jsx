import { useState } from 'react';
import { FAQ_ITEMS } from '../../constants/landingContent';

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (idx) => {
    setOpenIndex((current) => (current === idx ? -1 : idx));
  };

  return (
    <section
      data-reveal="2"
      className="w-full glass glass-strong rounded-[32px] p-6 sm:p-10 flex flex-col text-left transition-all"
    >
      {/* Eyebrow & Section Heading */}
      <div className="w-full text-center sm:text-left mb-6 sm:mb-8">
        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-pink block mb-1">
          FAQ
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-cloud tracking-tight">
          Questions you might have
        </h2>
      </div>

      {/* Accordion list */}
      <div className="w-full space-y-2.5">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          const questionId = `faq-q-${idx}`;
          const answerId = `faq-a-${idx}`;

          return (
            <div
              key={idx}
              className={`rounded-2xl transition-all duration-200 border ${
                isOpen
                  ? 'border-pink/40 bg-pink/[0.03] border-l-4 border-l-pink'
                  : 'border-glass-divider bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <h3>
                <button
                  type="button"
                  id={questionId}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggleItem(idx)}
                  className="w-full min-h-[48px] px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2 rounded-2xl"
                >
                  <span className="font-sans font-medium text-xs sm:text-sm text-cloud/95 leading-snug">
                    {item.question}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-pink' : 'text-cloud/50'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </h3>

              <div
                id={answerId}
                role="region"
                aria-labelledby={questionId}
                className={`grid transition-[grid-template-rows] duration-250 ease-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 sm:px-5 pb-4 pt-1 font-sans text-xs sm:text-sm text-cloud/75 leading-relaxed">
                    {item.isTrust ? (
                      <p>
                        {item.answerPrefix}
                        <a
                          href={item.linkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink hover:underline font-semibold focus-visible:outline-2 focus-visible:outline-pink focus-visible:outline-offset-2 rounded"
                        >
                          {item.linkText}
                        </a>
                        {item.answerSuffix}
                      </p>
                    ) : (
                      <p>{item.answer}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FaqAccordion;
