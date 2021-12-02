const Web3 = require('web3');
var http = require('http');
fs = require('fs');
var Common = require('ethereumjs-common').default;


var provider = 'https://bsc-dataseed1.binance.org:443';

var web3Provider = new Web3.providers.HttpProvider(provider);

var web3 = new Web3(web3Provider);
var Tx = require('ethereumjs-tx').Transaction;

web3.eth.getBlockNumber().then((result) => {
  console.log("Latest Block is ", result);
});


var BSC_FORK = Common.forCustomChain(
  'mainnet',
  {
    name: 'Binance Smart Chain Mainnet',
    networkId: 56,
    chainId: 56,
    url: 'https://bsc-dataseed.binance.org/'
  },
  'istanbul',
);

var tokenAddress = '0x025d657616f41997cd0291c6347e21fa75f379cb';

main();

var activePrivateKey = "";
var activeAddress = "";

async function createNewWallet() {
  var newAccount = web3.eth.accounts.create(web3.utils.randomHex(32));

  console.log(newAccount);
  storeNewWallet(newAccount.address, newAccount.privateKey);
}

async function storeNewWallet(address, key) {
  fs.writeFile('Keys/Keys.txt', address + "\n" + key, function (err) {
    if (err) return console.log(err);
    console.log('New wallet generated and stored');
  });
}
async function loadActiveWallet() {
  fs.readFile('Keys/Keys.txt', 'utf8', function (err, data) {
    if (err) {
      createNewWallet();
      return;
    }

    data = data.split("\n");

    console.log('OK: ' + 'Keys/Keys.txt');
    console.log(data[1])

    activeAddress = data[0];
    activePrivateKey = data[1];


  });
}







async function buyToken(inPrivateKey, address, amount, abi) {
  console.log("Try buy");
  var amountToBuyWith = web3.utils.toHex(amount);
  var privateKey = Buffer.from(inPrivateKey.slice(2), "hex");


  var abiArray = abi;
  var WBNBAddress = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';

  // var onlyOneWbnbCakePairAddress = '0xd22fa770dad9520924217b51bf7433c4a26067c2';
  // var pairAbi = JSON.parse(fs.readFileSync('cake-pair-onlyone-bnb-abi.json', 'utf-8'));
  // var pairContract = new web3.eth.Contract(pairAbi, onlyOneWbnbCakePairAddress/*, {from: targetAccount.address}*/);
  var amountOutMin = '100' + Math.random().toString().slice(2, 6);
  var pancakeSwapRouterAddress = '0x10ed43c718714eb63d5aa57b78b54704e256024e';



  var contract = new web3.eth.Contract(routerAbi, pancakeSwapRouterAddress, { from: address });
  var data = contract.methods.swapExactETHForTokens(
    web3.utils.toHex(amountOutMin),
    [WBNBAddress,
      tokenAddress],
    address,
    web3.utils.toHex(Math.round(Date.now() / 1000) + 60 * 20),
  );

  var count = await web3.eth.getTransactionCount(address);
  var rawTransaction = {
    "from": address,
    "gasPrice": web3.utils.toHex(7500000000),
    "gasLimit": web3.utils.toHex(900000),
    "to": pancakeSwapRouterAddress,
    "value": web3.utils.toHex(amountToBuyWith),
    "data": data.encodeABI(),
    "nonce": web3.utils.toHex(count)
  };

  var transaction = new Tx(rawTransaction, { 'common': BSC_FORK });

  transaction.sign(privateKey);

  var result = await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));



  console.log(result)



  return result;
}









async function main() {

  //   createNewWallet();
  loadActiveWallet();
  
  loadAbi('api.bscscan.com', '/api?module=contract&action=getabi&address=' + tokenAddress + '&apikey=4T85HYM82971KHWRSGI4C1A8NHINID1TPX');


}

async function onAbiLoaded(data) {
  var abi = JSON.parse(data).result;
  

  var contract = new web3.eth.Contract(JSON.parse(abi), tokenAddress);
  console.log("Abi loaded successfully  !");
  
  var currentBlock = await web3.eth.getBlockNumber();
  var activeBlock = currentBlock - 2;

  var decimals = Math.pow(10, 18); // BNB Decimals = 18

  
  /*
  while (true) {
    try {
      var bnbAmount = 0.001;
      await buyToken(activePrivateKey, activeAddress, Math.round(decimals * bnbAmount), abi);
      break;
    } catch {

    }

  }
*/
  var stop = false;
  while (true) {
    if(stop) {
      break;
    }
    
    var cBlock = await web3.eth.getBlockNumber();

    if (currentBlock != cBlock) {
      
      await web3.eth.getPastLogs({ fromBlock: activeBlock, address: tokenAddress})
        .then(async res => {
          //res.forEach(async rec => {
          //  console.log(rec.blockNumber, rec.transactionHash, rec.topics);
            
            try {
              var bnbAmount = 0.017;
              var a = await buyToken(activePrivateKey, activeAddress, Math.round(decimals * bnbAmount), abi);
              console.log("Transaction went through ...");
              stop = true;
              return;
            } catch {
        
            }
            
            
            
            
            
        //  });
        }).catch(err => console.log("getPastLogs failed", err));




      var difference = cBlock - currentBlock;

      currentBlock = cBlock;

      var activeBlock = currentBlock - difference;


    }




  }
















  /*
  subscription.unsubscribe(function(error, success){
    if(success)
        console.log('Successfully unsubscribed!');
  });
  */



  // console.log(abi);

}



async function loadAbi(_host, _path) {
  var options = {
    host: _host,
    path: _path
  }
  var returnVal = "x";

  var request = await http.request(options, async function (res) {
    var data = '';

    res.on('data', async function (chunk) {
      data += chunk;
    });
    res.on('end', async function () {
      // console.log(data);
      try {
        
        await onAbiLoaded(data);
      } catch {
        if( JSON.parse(data).status == 0) {
           console.log("Abi error trying again ...  " + JSON.parse(data).result);
           loadAbi(_host, _path);
        }
      }
      
      
    });


  });
  request.on('error', async function (e) {
    // console.log(e.message);
  });



  request.end();



}






//const NameContract = new web3.eth.Contract(contract_abi, "0x62b89a0e9a3c1229140789a78d71acb29c7e529a");


var routerAbi = JSON.parse('[{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]');