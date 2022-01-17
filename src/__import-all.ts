/* eslint-disable filenames/match-regex */

// this file is cut after build

// Since this module is a library, it can contain some files intended
// to be imported from other project and without any internal imports.
// This function forces building all the files from modules dir
// to include them on build even if they are not imported explicitly.
export default function importAll(path: string[]) {
	// throw new Error("Just don't call it. Thank you :)");
	import(`./modules/${path[0]}.ts`);
	import(`./modules/${path[0]}/${path[1]}.ts`);
	import(`./modules/${path[0]}/${path[1]}/${path[2]}.ts`);
	import(`./modules/${path[0]}/${path[1]}/${path[2]}/${path[3]}.ts`);
	import(`./modules/${path[0]}/${path[1]}/${path[2]}/${path[3]}/${path[4]}.ts`);
}
