import { DeployFunction } from 'hardhat-deploy/types';
import { THardhatRuntimeEnvironmentExtended } from 'helpers/types/THardhatRuntimeEnvironmentExtended';

const func: DeployFunction = async (hre: THardhatRuntimeEnvironmentExtended) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log(deployer);
  const verifier = await deploy('Verifier', {
    from: deployer,
    log: true,
  });
  const poseidon = await deploy('PoseidonT3', {
    from: deployer,
    log: true,
  });
  const incrementalBinaryTree = await deploy('IncrementalBinaryTree', {
    from: deployer,
    log: true,
    libraries: {
      PoseidonT3: poseidon.address,
    },
  });
  await deploy('ZKVote', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [verifier.address],
    log: true,
    libraries: {
      IncrementalBinaryTree: incrementalBinaryTree.address,
    },
  });
};
export default func;
func.tags = ['ZKVote'];
