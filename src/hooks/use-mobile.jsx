import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Função de inicialização segura para SSR — evita acesso a `window` antes de montar
const getInitialIsMobile = () =>
  typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getInitialIsMobile)

  React.useDebugValue(isMobile ? "mobile" : "desktop")

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}