type StripBannerItem = {
  id: number;
  emoji: string;
  mainText: string;
  subText: string;
  primaryButton: {
    text: string;
    className?: string;
    href: string;
  };
  secondaryLink: {
    text: string;
    className?: string;
    href: string;
  };
};
const StripBanner = ({
  stripBannerTitle,
  stripBanner,
}: {
  stripBannerTitle: string;
  stripBanner: StripBannerItem;
}) => {
  return (
    <div>
      <h3 className='font-medium mb-4'>{stripBannerTitle}</h3>
      <div className='relative overflow-hidden bg-linear-to-r from-orange-500 via-red-500 to-pink-500 text-white py-3 rounded-lg'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-2'>
            <div className='flex items-center gap-3'>
              <span className='font-bold text-sm'>
                {stripBanner.emoji} {stripBanner.mainText}
              </span>
              <span className='hidden md:inline text-sm text-orange-100'>
                {stripBanner.subText}
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <a
                className={
                  stripBanner.primaryButton.className ||
                  'bg-gray-100 text-gray-800 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-200'
                }
                href={stripBanner.primaryButton.href}
              >
                {stripBanner.primaryButton.text}
              </a>
              <a
                className={
                  stripBanner.secondaryLink.className ||
                  'text-xs text-orange-200 underline'
                }
                href={stripBanner.secondaryLink.href}
              >
                {stripBanner.secondaryLink.text}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { StripBanner };
export type { StripBannerItem };
