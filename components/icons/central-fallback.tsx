/*
 * Stand-ins for the licensed Central Icons package (`central-icons` alias of
 * @central-icons-react/round-filled-radius-2-stroke-1.5). next.config.ts resolves `central-icons`
 * to this file only when the package is not installed (it installs with CENTRAL_LICENSE_KEY).
 * Drawn per the OSDS rule for designs without the package: 24px grid, currentColor,
 * 1.5px stroke, round caps and joins. Names match the real package one to one.
 */
import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

function icon(displayName: string, body: ReactNode) {
  function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {body}
      </svg>
    )
  }
  Icon.displayName = displayName
  return Icon
}

// Controls used inside OSDS components
export const IconCheckmark1Medium = icon('IconCheckmark1Medium', <path d="m6 12.5 4 4 8-9" />)
export const IconChevronDownMedium = icon('IconChevronDownMedium', <path d="m7 10 5 5 5-5" />)
export const IconChevronTopMedium = icon('IconChevronTopMedium', <path d="m7 14 5-5 5 5" />)
export const IconChevronLeftMedium = icon('IconChevronLeftMedium', <path d="m14 7-5 5 5 5" />)
export const IconChevronRightMedium = icon('IconChevronRightMedium', <path d="m10 7 5 5-5 5" />)
export const IconChevronGrabberVertical = icon('IconChevronGrabberVertical', <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />)
export const IconCrossMedium = icon('IconCrossMedium', <path d="m7 7 10 10M17 7 7 17" />)
export const IconMinusMedium = icon('IconMinusMedium', <path d="M6 12h12" />)
export const IconPlusMedium = icon('IconPlusMedium', <path d="M12 6v12M6 12h12" />)
export const IconCirclePlaceholderOn = icon('IconCirclePlaceholderOn', <circle cx="12" cy="12" r="5" fill="currentColor" />)
export const IconLoadingCircle = icon('IconLoadingCircle', <path d="M12 4a8 8 0 1 0 8 8" />)
export const IconDotGrid1x3Horizontal = icon(
  'IconDotGrid1x3Horizontal',
  <g fill="currentColor" stroke="none">
    <circle cx="6" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="18" cy="12" r="1.5" />
  </g>,
)
export const IconMagnifyingGlass = icon('IconMagnifyingGlass', <><circle cx="11" cy="11" r="6" /><path d="m15.5 15.5 4 4" /></>)
export const IconSidebarSimpleLeftWide = icon(
  'IconSidebarSimpleLeftWide',
  <><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M9.5 5v14" /></>,
)
export const IconCalendar1 = icon(
  'IconCalendar1',
  <><rect x="4" y="5.5" width="16" height="14" rx="2.5" /><path d="M4 10h16M8.5 3.5v3M15.5 3.5v3" /></>,
)
export const IconCalendarClock = icon(
  'IconCalendarClock',
  <><path d="M20 10V8a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 8v9a2.5 2.5 0 0 0 2.5 2.5H10M4 10h16M8.5 3.5v3M15.5 3.5v3" /><circle cx="17" cy="17" r="4" /><path d="M17 15.5V17l1 1" /></>,
)

// Navigation
export const IconLayoutDashboard = icon(
  'IconLayoutDashboard',
  <><rect x="4" y="4" width="7" height="9" rx="1.5" /><rect x="13" y="4" width="7" height="5" rx="1.5" /><rect x="13" y="11" width="7" height="9" rx="1.5" /><rect x="4" y="15" width="7" height="5" rx="1.5" /></>,
)
export const IconReceiptBill = icon(
  'IconReceiptBill',
  <><path d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" /><path d="M9 8h6M9 11.5h6M9 15h3" /></>,
)
export const IconPeople = icon(
  'IconPeople',
  <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M15.5 5.7a3 3 0 0 1 0 5.6M17.5 14.2A5.5 5.5 0 0 1 20.5 19" /></>,
)
export const IconLayersTwo = icon(
  'IconLayersTwo',
  <><path d="m12 4 8 4.5-8 4.5-8-4.5z" /><path d="m4 13 8 4.5 8-4.5" /></>,
)
export const IconWallet1 = icon(
  'IconWallet1',
  <><path d="M18 7.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2H5" /><circle cx="16" cy="14" r="1" fill="currentColor" /></>,
)
export const IconCreditCard1 = icon(
  'IconCreditCard1',
  <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M3.5 10h17M7 15h3" /></>,
)
export const IconSettingsGear1 = icon(
  'IconSettingsGear1',
  <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" /></>,
)
export const IconDoor = icon(
  'IconDoor',
  <><path d="M14 4H7.5A1.5 1.5 0 0 0 6 5.5v13A1.5 1.5 0 0 0 7.5 20H14" /><path d="M11 12h9M17 9l3 3-3 3" /></>,
)
export const IconBuildings = icon(
  'IconBuildings',
  <><path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5h7A1.5 1.5 0 0 1 14 6.5V20M14 10h4.5a1.5 1.5 0 0 1 1.5 1.5V20M3 20h18" /><path d="M7.5 9h3M7.5 12.5h3M7.5 16h3" /></>,
)
export const IconUser = icon('IconUser', <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5a7 7 0 0 1 14 0" /></>)
export const IconUserDuo = icon(
  'IconUserDuo',
  <><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="16.5" cy="7.5" r="2.5" /><path d="M17 12.5a4.5 4.5 0 0 1 3.5 4.5" /></>,
)

// Actions
export const IconPencil = icon('IconPencil', <><path d="M14.5 5.5 18.5 9.5" /><path d="M4.5 19.5 5.5 15 15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L9 18.5z" /></>)
export const IconTrashCan = icon(
  'IconTrashCan',
  <><path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" /><path d="M6.5 7 7.4 18.6A1.5 1.5 0 0 0 8.9 20h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" /><path d="M10 11v5M14 11v5" /></>,
)
export const IconPaperPlaneTopRight = icon('IconPaperPlaneTopRight', <><path d="M20 4 10.5 13.5" /><path d="M20 4 14 20l-3.5-6.5L4 10z" /></>)
export const IconFileDownload = icon(
  'IconFileDownload',
  <><path d="M13.5 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5z" /><path d="M13.5 3.5v5h5M12 11v6M9.5 14.5 12 17l2.5-2.5" /></>,
)
export const IconFileText = icon(
  'IconFileText',
  <><path d="M13.5 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5z" /><path d="M13.5 3.5v5h5M9 13h6M9 16.5h4" /></>,
)
export const IconSquareBehindSquare1 = icon(
  'IconSquareBehindSquare1',
  <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /></>,
)
export const IconShareOs = icon('IconShareOs', <><path d="M12 15V4M8 7.5 12 4l4 3.5" /><path d="M8.5 11H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1.5" /></>)
export const IconSquareArrowTopRight = icon(
  'IconSquareArrowTopRight',
  <><path d="M19.5 13v4.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2H11" /><path d="M14.5 4.5h5v5M19.5 4.5l-8 8" /></>,
)
export const IconEyeOpen = icon('IconEyeOpen', <><path d="M3 12s3.5-6.5 9-6.5S21 12 21 12s-3.5 6.5-9 6.5S3 12 3 12z" /><circle cx="12" cy="12" r="2.5" /></>)
export const IconFilter1 = icon('IconFilter1', <path d="M4.5 6h15M7.5 12h9M10.5 18h3" />)
export const IconSortArrowUpDown = icon('IconSortArrowUpDown', <path d="M8 18V6M5 9l3-3 3 3M16 6v12M13 15l3 3 3-3" />)
export const IconArrowUp = icon('IconArrowUp', <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />)
export const IconArrowDown = icon('IconArrowDown', <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />)
export const IconArrowLeft = icon('IconArrowLeft', <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />)
export const IconArrowRight = icon('IconArrowRight', <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />)
export const IconArrowUpRight = icon('IconArrowUpRight', <path d="M7 17 17 7M8.5 7H17v8.5" />)
export const IconArrowDownRight = icon('IconArrowDownRight', <path d="M7 7 17 17M17 8.5V17H8.5" />)
export const IconCirclePlus = icon('IconCirclePlus', <><circle cx="12" cy="12" r="8" /><path d="M12 8.5v7M8.5 12h7" /></>)

// Status and data
export const IconCircleCheck = icon('IconCircleCheck', <><circle cx="12" cy="12" r="8" /><path d="m8.5 12.3 2.3 2.3 4.7-5" /></>)
export const IconClock = icon('IconClock', <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></>)
export const IconExclamationTriangle = icon(
  'IconExclamationTriangle',
  <><path d="M10.3 5 3.6 16.7A2 2 0 0 0 5.3 19.7h13.4a2 2 0 0 0 1.7-3L13.7 5a2 2 0 0 0-3.4 0z" /><path d="M12 10v3.5M12 16.5h.01" /></>,
)
export const IconTrending3 = icon('IconTrending3', <path d="m4 16 5-5 3.5 3.5L20 7M15 7h5v5" />)
export const IconLineChart1 = icon('IconLineChart1', <path d="M4 4v16h16M7.5 14.5l3.5-4 3 2.5 4.5-5.5" />)
export const IconInboxEmpty = icon(
  'IconInboxEmpty',
  <><path d="M4 13.5 6.3 6a2 2 0 0 1 1.9-1.5h7.6A2 2 0 0 1 17.7 6l2.3 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M4 13.5h4.5l1 2h5l1-2H20" /></>,
)
export const IconDollar = icon('IconDollar', <path d="M12 4v16M16 7.5c-.6-1.2-2-2-4-2-2.5 0-4 1.2-4 3s1.5 2.6 4 3.2 4 1.4 4 3.3-1.6 3-4 3c-2.1 0-3.6-.9-4.2-2.2" />)
export const IconTag = icon('IconTag', <><path d="M4 12.2V5.5A1.5 1.5 0 0 1 5.5 4h6.7l7.3 7.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0z" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" /></>)
export const IconFolder1 = icon('IconFolder1', <path d="M4 7.5A2 2 0 0 1 6 5.5h3.5l2 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />)
export const IconEmail1 = icon('IconEmail1', <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7.5 7.5 5.5 7.5-5.5" /></>)
export const IconTelephone = icon(
  'IconTelephone',
  <path d="M8.6 4.5H6.2A1.7 1.7 0 0 0 4.5 6.3c.4 7.3 5.9 12.8 13.2 13.2a1.7 1.7 0 0 0 1.8-1.7v-2.4a1 1 0 0 0-.7-1l-2.9-1a1 1 0 0 0-1.1.3l-1.1 1.4a10.4 10.4 0 0 1-4.8-4.8l1.4-1.1a1 1 0 0 0 .3-1.1l-1-2.9a1 1 0 0 0-1-.7z" />,
)
export const IconLocation = icon('IconLocation', <><path d="M12 20s6.5-5.4 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 14.6 12 20 12 20z" /><circle cx="12" cy="9.5" r="2.3" /></>)
export const IconGlobe = icon('IconGlobe', <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.2 2.2 3.3 4.9 3.3 8s-1.1 5.8-3.3 8c-2.2-2.2-3.3-4.9-3.3-8S9.8 6.2 12 4z" /></>)
export const IconPasswordStars = icon(
  'IconPasswordStars',
  <><rect x="3" y="7" width="18" height="10" rx="2.5" /><path d="M7.5 10.5v3M6.2 11.3l2.6 1.4M6.2 12.7l2.6-1.4M12 10.5v3M10.7 11.3l2.6 1.4M10.7 12.7l2.6-1.4M16 13h2.5" /></>,
)
export const IconMoon = icon('IconMoon', <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />)
export const IconSun = icon(
  'IconSun',
  <><circle cx="12" cy="12" r="3.5" /><path d="M12 3.5v1.5M12 19v1.5M3.5 12H5M19 12h1.5M6 6l1 1M17 17l1 1M6 18l1-1M17 7l1-1" /></>,
)
export const IconSparklesTwo = icon('IconSparklesTwo', <path d="M10 4.5 11.5 9 16 10.5 11.5 12 10 16.5 8.5 12 4 10.5 8.5 9zM17 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />)

export const IconChainLink1 = icon(
  'IconChainLink1',
  <><path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" /><path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" /></>,
)
export const IconBank = icon(
  'IconBank',
  <><path d="M4 9.5 12 4.5l8 5H4z" /><path d="M6 10v7M10 10v7M14 10v7M18 10v7M4 19.5h16" /></>,
)
export const IconBitcoin = icon(
  'IconBitcoin',
  <><path d="M8.5 6h5a3 3 0 0 1 0 6h-5zM8.5 12h6a3 3 0 0 1 0 6h-6zM8.5 6v12" /><path d="M10.5 4v2M13.5 4v2M10.5 18v2M13.5 18v2" /></>,
)
export const IconQrCode = icon(
  'IconQrCode',
  <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2" /></>,
)
export const IconCoins = icon(
  'IconCoins',
  <><ellipse cx="9" cy="7" rx="5" ry="2.5" /><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7" /><path d="M10 15.5c.6 1.2 2.6 2 5 2 2.8 0 5-1.1 5-2.5v-4c0-1.4-2.2-2.5-5-2.5" /></>,
)
export const IconPeopleAdd = icon(
  'IconPeopleAdd',
  <><circle cx="10" cy="8.5" r="3.5" /><path d="M3.5 19.5a6.5 6.5 0 0 1 11-4.7M18 14v6M15 17h6" /></>,
)
export const IconCircleX = icon('IconCircleX', <><circle cx="12" cy="12" r="8" /><path d="m9.5 9.5 5 5M14.5 9.5l-5 5" /></>)
export const IconArrowRotateClockwise = icon('IconArrowRotateClockwise', <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4h-4" /></>)
export const IconEmail2Check = icon('IconEmail2Check', <><path d="M20 12V7.5A2.5 2.5 0 0 0 17.5 5h-11A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H12" /><path d="m4.5 7.5 7.5 5 7.5-5M15 18l2 2 4-4" /></>)
