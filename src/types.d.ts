declare module "apcach" {
  export function cssToApcach(
    fg: string,
    options?: { bg?: string },
  ): {
    contrastConfig: {
      cr: number;
    };
  };
}
