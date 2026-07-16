import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isWeChatBrowser } from '@/lib/wechat';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeChatStoreButtonProps {
  locale: string;
  className?: string;
}

// A normal <a href> can't "jump" into a WeChat Mini Store — browsers can't
// open it and it has no ordinary web URL. The only real entry point is the
// mini-program QR code, and the right instructions depend on where the QR
// code and the camera that needs to scan it actually are:
//  - Inside WeChat's own in-app browser: long-press the image to identify it.
//  - On a phone, in a normal browser (Safari/Chrome): the QR is on the same
//    screen as the camera that would scan it, so "just scan it" doesn't
//    work — the phone can't photograph its own screen usefully. The real
//    path is save the image, then use WeChat's scan-from-album feature.
//  - On desktop: the QR is on a different device from the phone that scans
//    it, so "open WeChat and scan" is correct as-is.
export default function WeChatStoreButton({ locale, className }: WeChatStoreButtonProps) {
  const inWeChat = isWeChatBrowser();
  const isMobile = useIsMobile();

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
            : isMobile
              ? locale === 'zh'
                ? '长按图片保存到相册，再打开微信"扫一扫"，点击右上角相册图标选择该图片即可识别进入'
                : 'Press and hold the image to save it, then open WeChat "Scan", tap the album icon, and select the saved image to open the store'
              : locale === 'zh'
                ? '请打开手机微信，使用"扫一扫"扫描此二维码，进入微信小店下单'
                : 'Open WeChat on your phone and use "Scan" to scan this QR code and shop in our WeChat Store'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
