using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using System.Numerics;
public class AnnoArk : SmartContract
{
    public class LocationData
    {
        public BigInteger speed;
        public BigInteger lastLocationX;
        public BigInteger lastLocationY;
        public BigInteger destinationX;
        public BigInteger destinationY;
        public BigInteger lastLocationTime;
    }

    public class User
    {
        public byte[] address;
        public byte[] nickname;
        public byte[] country;
        public BigInteger hull;
        public BigInteger expandCnt;
        public LocationData locationData;
    }

    public class Island
    {
        public BigInteger index;
        public BigInteger x;
        public BigInteger y;
        public byte[] occupant;
        public BigInteger lastMineTime;
        public BigInteger money;
        public byte[] sponsorName;
        public byte[] sponsorLink;
        public BigInteger miningRate;
        public BigInteger mineBalance;
        public BigInteger lastCalcTime;
    }

    public class Pirate
    {
        public BigInteger index;
        public BigInteger respawnTimestamp;
        public bool alive;
    }

    public class Bancor
    {
        public object a;
        public object k;
        public object x;
        public object fee;
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

            byte[] r = new byte[1];

            return r;
        }
        else
        {   //Will elabrate for other cases
            return false;
        }
    }
}