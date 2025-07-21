import "@mui/material/styles";
import "@mui/material/Button";

declare module "@mui/material/styles" {
  interface Palette {
    amareloForteSL: Palette["primary"];
  }
  interface PaletteOptions {
    amareloForteSL?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    amareloForteSL: true;
  }
}

declare module "@mui/material/Checkbox" {
  interface CheckboxPropsColorOverrides {
    amareloForteSL: true;
  }
}
