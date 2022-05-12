// import { StaticJsonRpcProvider } from '@ethersproject/providers';
// import { useSignerAddress } from 'eth-hooks';
// import { useEthersContext, useBlockNumberContext } from 'eth-hooks/context';
// import { TCreateEthersModalConnector } from 'eth-hooks/models';
// import { Signer } from 'ethers';
// import { FC, useState } from 'react';
// import { Button, Navbar, NavbarBrand } from 'react-bootstrap';
// import { invariant } from 'ts-invariant';
// import { useDebounce } from 'use-debounce';
// import { useIsMounted } from 'usehooks-ts';
// import { NavBar } from '../NavBar';

// export interface IAccountProps {
//   ensProvider: StaticJsonRpcProvider | undefined;
//   localProvider?: StaticJsonRpcProvider | undefined;
//   createLoginConnector?: TCreateEthersModalConnector;
//   address?: string;
//   signer?: Signer;
//   hasContextConnect: boolean;
//   fontSize?: number;
//   blockExplorer: string;
// }

// export const Account: FC<IAccountProps> = (props: IAccountProps) => {
//   const blockNumber = useBlockNumberContext();
//   const ethersContext = useEthersContext();
//   const showLoadModal = !ethersContext.active;
//   const [connecting, setConnecting] = useState(false);

//   const isMounted = useIsMounted();
//   const [loadingButton, loadingButtonDebounce] = useDebounce(connecting, 1000, {
//     maxWait: 1500,
//   });

//   if (loadingButton && connecting) {
//     setConnecting(false);
//   }

//   const [signerAddress] = useSignerAddress(props.signer);
//   const address = props.address ?? signerAddress;
//   // if hasContextConnect = false, do not use context or context connect/login/logout.  only used passed in address
//   const [resolvedAddress] = useDebounce<string | undefined>(
//     props.hasContextConnect ? ethersContext.account : address,
//     200,
//     {
//       trailing: true,
//     }
//   );

//   const [resolvedSigner] = useDebounce<Signer | undefined>(
//     props.hasContextConnect ? ethersContext.signer : props.signer,
//     200,
//     {
//       trailing: true,
//     }
//   );

//   const handleLoginClick = (): void => {
//     if (props.createLoginConnector != null) {
//       const connector = props.createLoginConnector?.();
//       if (!isMounted()) {
//         invariant.log('openModal: no longer mounted');
//       } else if (connector) {
//         setConnecting(true);
//         ethersContext.openModal(connector);
//       } else {
//         invariant.warn('openModal: A valid EthersModalConnector was not provided');
//       }
//     }
//   };

//   const loadModalButton = (
//     <>{showLoadModal && props.createLoginConnector && <Button onClick={handleLoginClick}>Connect</Button>}</>
//   );

//   const logoutButton = (
//     <>
//       {!showLoadModal && props.createLoginConnector && <Button onClick={ethersContext.disconnectModal}>Logout</Button>}
//     </>
//   );

//   const display = (
//     <span>
//       {resolvedAddress != null && (
//         <NavbarBrand>
//           {resolvedAddress.slice(0, 6) +
//             '...' +
//             resolvedAddress.slice(resolvedAddress.length - 4, resolvedAddress.length)}
//         </NavbarBrand>
//       )}
//     </span>
//   );

//   return (
//     <div>
//       {display}
//       {props.hasContextConnect && (
//         <>
//           {loadModalButton}
//           {logoutButton}
//         </>
//       )}
//     </div>
//   );
// };

export { }