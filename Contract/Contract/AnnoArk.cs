using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using Neo.SmartContract.Framework.Services.System;
using System;
using System.Numerics;
using System.ComponentModel;


namespace Contract
{
    public class AnnoArk : SmartContract
    {
        public static string name()
        {
            return "AnnoArkContract";
        }

        public static string Version()
        {
            return "0.0.1";
        }

        public static readonly byte[] Owner = "AQZSaHrJfwj8AYH38FdC6zR1TQhcAdm5SE".ToScriptHash();

        public static object Main(string operation, params object[] args)
        {

            if (Runtime.Trigger == TriggerType.Verification)
            {
                if (Owner.Length == 20)
                {
                    return Runtime.CheckWitness(Owner);
                }
                else if (Owner.Length == 33)
                {
                    byte[] signature = operation.AsByteArray();
                    return VerifySignature(signature, Owner);
                }
                return true;
            } else if (Runtime.Trigger == TriggerType.Application) {
                //必须在入口函数取得callscript，调用脚本的函数，也会导致执行栈变化，再取callscript就晚了
                var callscript = ExecutionEngine.CallingScriptHash;


            }
            return false;
        }
    }
}
