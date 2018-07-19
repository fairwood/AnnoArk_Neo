export default class MathUtil{



    static lerp(a: number, b: number, t: number, clamp?: boolean): number {
        if (clamp) t = Math.max(0, Math.min(1, t));
        return a * (1 - t) + b * t;
    }
    static lerpVec2(a: cc.Vec2, b: cc.Vec2, t: number, clamp?: boolean): cc.Vec2 {
        if (clamp) t = Math.max(0, Math.min(1, t));
        return a.mul(1 - t).add(b.mul(t));
    }
}