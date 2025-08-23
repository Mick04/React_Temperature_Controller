// import React from "react";
// import {
//   Paper,
//   Typography,
//   Box,
//   Switch,
//   FormControlLabel,
//   Slider,
// } from "@mui/material";
// import type { ControlSettings } from "../types";

// interface HeaterControlProps {
//   controlSettings: ControlSettings;
//   onControlChange: (settings: ControlSettings) => void;
// }

// const HeaterControl: React.FC<HeaterControlProps> = ({
//   controlSettings,
//   onControlChange,
// }) => {
//   const handleAutoModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     onControlChange({
//       ...controlSettings,
//       control_mode: event.target.checked ? "auto" : "manual",
//     });
//   };

//   const handleTargetTempChange = (_: Event, value: number | number[]) => {
//     onControlChange({
//       ...controlSettings,
//       target_temperature: value as number,
//     });
//   };

//   return (
//     <Paper elevation={3} sx={{ p: 3, height: "fit-content" }}>
//       <Typography variant="h6" gutterBottom>
//         Heater Control
//       </Typography>

//       <Box sx={{ mb: 3 }}>
//         <FormControlLabel
//           control={
//             <Switch
//               checked={controlSettings.control_mode === "auto"}
//               onChange={handleAutoModeChange}
//             />
//           }
//           label="Auto Mode"
//         />
//       </Box>

//       <Box sx={{ mb: 2 }}>
//         <Typography gutterBottom>
//           Target Temperature: {controlSettings.target_temperature}°C
//         </Typography>
//         <Slider
//           value={controlSettings.target_temperature}
//           onChange={handleTargetTempChange}
//           min={15}
//           max={35}
//           step={0.5}
//           marks
//           valueLabelDisplay="auto"
//         />
//       </Box>

//       <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
//         <Typography variant="body2" color="text.secondary">
//           Heater Status:{" "}
//           {controlSettings.heater_enabled ? "ENABLED" : "DISABLED"}
//         </Typography>
//       </Box>
//     </Paper>
//   );
// };

// export default HeaterControl;
