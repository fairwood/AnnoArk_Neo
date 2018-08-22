using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using Neo.SmartContract.Framework.Services.System;
using System;
using System.Numerics;
using System.ComponentModel;

using Helper = Neo.SmartContract.Framework.Helper;
namespace Contract
{
    public class AnnoArk : SmartContract
    {
        public static class Const
        {
            public const string PxUser = "U_";
            public const string PxBancor = "B_";
            public const string PxMaxUID = "MUID_";
            public const string PxUID = "UID_";
            public const float cityMoveSpeed = 150;
            public const float raidCityCargoRate = 0.1f;
            public const float safeZoneLine = 1567;
            public const float damagePerAttackCity = 0.1f;
            public const float energyCostPerLyExpand = 0.01f;
            public const float nukemissSpeed = 3600;
            public const float nukeRadius = 120;
            public const float totalPirateCnt = 1000;
            public const float pirateCargoC0 = 100;
            public const float pirateArmyC0 = 10;
            public const float piratePeriodTimestamp = 0;
        }

        [Serializable]
        public class GlobalInfo
        {
            public BigInteger userCnt;
        }

        [Serializable]
        public class LocationData
        {
            public byte[] address;
            public BigInteger speed;
            public BigInteger lastLocationX;
            public BigInteger lastLocationY;
            public BigInteger destinationX;
            public BigInteger destinationY;
            public BigInteger lastLocationTime;
        }

        [Serializable]
        public class User
        {
            public byte[] address;
            public byte[] nickname;
            public byte[] country;
            public BigInteger hull;
            public BigInteger expandCnt;
        }

        public static class Util
        {

            public static BigInteger GetMaxUID()
            {
                byte[] data = Storage.Get(Storage.CurrentContext, Const.PxMaxUID);
                if (data == null || data.Length < 1)
                {
                    return 0;
                }
                return (BigInteger)Helper.Deserialize(data);
            }

            public static BigInteger SetMaxUID(BigInteger cur)
            {
                Storage.Put(Storage.CurrentContext, Const.PxMaxUID, Helper.Serialize(cur));
                return cur;
            }

            public static byte[] GetUID(BigInteger index)
            {

                byte[] key = Const.PxUID.AsByteArray().Concat(index.AsByteArray());
                return Storage.Get(Storage.CurrentContext, key);
            }

            public static void SetUID(BigInteger index, byte[] data)
            {
                byte[] key = Const.PxUID.AsByteArray().Concat(index.AsByteArray());
                Storage.Put(Storage.CurrentContext, key, data);
            }

            public static User GetUser(byte[] addr)
            {
                byte[] key = Const.PxUser.AsByteArray().Concat(addr);
                byte[] bytes = Storage.Get(Storage.CurrentContext, key);
                if (bytes == null || bytes.Length < 1)
                {
                    return null;
                }
                return (User)Helper.Deserialize(bytes);
            }

            public static void SetUser(User user)
            {
                byte[] bytes = Helper.Serialize(user);
                byte[] key = Const.PxUser.AsByteArray().Concat(user.address);
                Storage.Put(Storage.CurrentContext, key, bytes);
            }

        }

        public static string Name()
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
            }
            else if (Runtime.Trigger == TriggerType.Application)
            {
                //必须在入口函数取得callscript，调用脚本的函数，也会导致执行栈变化，再取callscript就晚了
                var callscript = ExecutionEngine.CallingScriptHash;

                if (operation == "name")
                {
                    return Name();
                }

                if (operation == "version")
                {
                    return Version();
                }

                switch (operation)
                {
                    case "userRegister":
                        return UserRegister(args);
                    case "getUser":
                        return GetUser(args);
                    case "getUID":
                        return GetUID(args);
                    default:
                        break;

                }
            }
            return false;
        }

        public static bool UserRegister(params object[] args)
        {
            if (args.Length < 2) return false;

            byte[] from = (byte[])args[0];
            if (!Runtime.CheckWitness(from))
            {
                return false;
            }
            else
            {
                User find = Util.GetUser(from);
                if (find != null)
                {
                    // has register
                    return false;
                }

                //Put new user into storage
                User user = new User();
                user.address = from;
                user.nickname = (byte[])args[1];
                Util.SetUser(user);

                BigInteger max = Util.GetMaxUID();
                BigInteger cur = BigInteger.Add(max, 1);
                Util.SetMaxUID(cur);
                Util.SetUID(cur, from);
                return true;
            }
        }

        public static User GetUser(params object[] args)
        {

            if (args.Length < 1) return null;

            byte[] from = (byte[])args[0];
            if (!Runtime.CheckWitness(from))
            {
                return null;
            }
            else
            {
                return Util.GetUser(from);
            }
        }

        public static byte[] GetUID(params object[] args)
        {
            if (args.Length < 2) return null;

            byte[] from = (byte[])args[0];
            if (!Runtime.CheckWitness(from))
            {
                return null;
            }
            else
            {
                BigInteger indx = (BigInteger)args[1];
                return Util.GetUID(indx);
            }
        }
    }
}