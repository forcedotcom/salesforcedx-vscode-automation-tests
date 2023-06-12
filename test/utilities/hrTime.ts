export class HrTime {
  private _startTime: [number, number];

  constructor() {
    this._startTime = process.hrtime();
  }

  public getElapsedSeconds(from?: [number, number]): number {
    const elapsed = process.hrtime(from ?? this._startTime);
    return elapsed[0] + elapsed[1] / 1e9;
  }

  public getElapsedMilliseconds(from?: [number, number]): number {
    return this.getElapsedSeconds(from) * 1000;
  }

  public get startTime(): [number, number] {
    return this._startTime;
  }
}