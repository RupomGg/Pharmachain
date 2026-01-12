import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="relative bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 border-r-[3px] border-r-teal-500 hover:border-r-[4px] hover:border-r-teal-600 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    className="rounded-lg font-semibold"
                  >
                    Wrong network
                  </Button>
                )
              }

              // Only show account button, no chain button
              return (
                <Button
                  onClick={openAccountModal}
                  className="bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 border-r-[3px] border-r-teal-500 hover:border-r-[4px] hover:border-r-teal-600 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
                >
                  {account.displayName}
                  {account.displayBalance
                    ? ` (${account.displayBalance})`
                    : ''}
                </Button>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
