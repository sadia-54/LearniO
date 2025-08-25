class Result {
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }
  static ok(value) { return new Result(true, value, null); }
  static fail(error) { return new Result(false, null, error); }
}
module.exports = { Result };
