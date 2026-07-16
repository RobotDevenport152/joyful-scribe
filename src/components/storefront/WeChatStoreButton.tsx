import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isWeChatBrowser } from '@/lib/wechat';

interface WeChatStoreButtonProps {
  locale: string;
  className?: string;
}

// A normal <a href> can't "jump" into a WeChat Mini Store — browsers can't
// open it and it has no ordinary web URL. The only real entry point is the
// mini-program QR code, scanned via WeChat's own "扫一扫", or long-pressed
// to identify when the page is already open inside WeChat's in-app browser.
export default function WeChatStoreButton({ locale, className }: WeChatStoreButtonProps) {
  const inWeChat = isWeChatBrowser();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            className ??
            'w-full py-3 border border-gold text-gold-dark font-body font-semibold rounded-sm tracking-wider hover:bg-gold/10 transition-colors'
          }
        >
          {locale === 'zh' ? '微信小店购买' : 'Buy on WeChat Store'}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{locale === 'zh' ? '微信小店' : 'WeChat Store'}</DialogTitle>
        </DialogHeader>
        <img
          src="/images/wechat-store-card.jpg"
          alt={locale === 'zh' ? '微信小店二维码' : 'WeChat Store QR code'}
          className="w-full rounded-lg border border-border"
        />
        <p className="text-center text-sm text-muted-foreground font-body">
          {inWeChat
            ? locale === 'zh'
              ? '长按图片，识别小程序码即可进入微信小店下单'
              : 'Press and hold the image, then tap to open the WeChat Store'
            : locale === 'zh'
              ? '请打开微信，使用"扫一扫"扫描二维码，进入微信小店下单'
              : 'Open WeChat and use "Scan" to scan the QR code and shop in our WeChat Store'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
