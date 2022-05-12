import { EventFilter, BaseContract, Event } from "ethers";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { Provider } from "@ethersproject/providers";

import {
  TEthersProvider,
  TEthersProviderOrSigner,
} from "../models/providerTypes";

const queryKey = {
  namespace: "contracts",
  key: "useEventListener",
} as const;
export const providerKey = (
  providerOrSigner: TEthersProviderOrSigner | undefined
): Record<"provider" | "signer", string> => {
  if (providerOrSigner == null)
    return { provider: "undefined provider", signer: "undefined signer" };

  if (providerOrSigner instanceof Provider) {
    return {
      provider: `${providerOrSigner?.network?.chainId}_${
        providerOrSigner?.network?.name
      }_${providerOrSigner?.connection.url.substring(0, 25)}`,
      signer: "isProvider",
    };
  } else {
    const provider = providerOrSigner.provider as TEthersProvider;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const signerStr: string = (providerOrSigner as any)?.address ?? "";
    if (provider && provider?.network) {
      return {
        signer: `isSigner_${providerOrSigner._isSigner}_${signerStr}`,
        provider: `${provider?.network?.chainId}_${
          provider?.network?.name
        }_${provider?.connection.url.substring(0, 25)}`,
      };
    }
  }

  return { provider: "unknown provider", signer: "unknown signer" };
};

const contractKey = (
  contract: BaseContract | undefined
): Partial<Record<"contract" | "provider", string>> => {
  if (contract == null) return { contract: "undefined contract" };

  const address = contract.address;
  const provider = providerKey(
    contract.provider as TEthersProvider | undefined
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const signerStr: string = (contract.signer as any)?.address ?? "";
  const fragments = contract.interface.fragments
    .map((m) => m.name)
    .reduce((oldValue, current) => {
      let newValue = oldValue;
      if (newValue == null) {
        newValue = "";
      }
      newValue += `${current},`;
      return newValue;
    }, "");

  return { contract: `${address}_${signerStr}_${fragments}`, ...provider };
};

export const useEventListener = (
  contract: BaseContract | undefined,
  eventFilter: string | EventFilter | undefined,
  startBlock: number,
  toBlock: number | undefined = undefined
) => {
  const keys = [
    {
      ...queryKey,
      ...contractKey(contract),
    },
    {
      eventFilter,
      startBlock,
      toBlock,
    },
  ] as const;
  const { data, refetch, status } = useQuery(
    keys,
    async (keys): Promise<Event[]> => {
      const result = await contract?.queryFilter(
        eventFilter as EventFilter,
        startBlock,
        toBlock
      );
      return result ?? [];
    },
    {}
  );

  // update the result when ethers calls the event listner
  useEffect(() => {
    if (eventFilter != null) {
      const listener = (): void => {
        void refetch();
      };
      try {
        contract?.on(eventFilter, listener);
        return (): void => {
          contract?.off(eventFilter, listener);
        };
      } catch (e) {
        console.log(e);
      }
    }
  }, [contract, eventFilter, refetch]);

  // const blockNumber = useBlockNumberContext();
  // useEthersUpdater(refetch, blockNumber, options);

  return [data ?? [], refetch, status];
};
