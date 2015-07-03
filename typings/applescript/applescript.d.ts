declare module AppleScript {
  export interface AppleScript {
    execString(script: string, callback?: (err: any, rtn: any) => void);
  }
}

declare module "applescript" {
	var as: AppleScript.AppleScript;
	export = as;
}
