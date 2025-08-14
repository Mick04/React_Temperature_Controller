import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";

const FirebaseDebugger: React.FC = () => {
  const [firebaseData, setFirebaseData] = useState<any>(null);
  const [systemData, setSystemData] = useState<any>(null);
  const [controlData, setControlData] = useState<any>(null);
  const [sensorsData, setSensorsData] = useState<any>(null);

  useEffect(() => {
    // Listen to entire Firebase database
    const rootRef = ref(database, "/");
    const unsubscribeRoot = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      setFirebaseData(data);
    });

    // Listen to system path specifically
    const systemRef = ref(database, "/system");
    const unsubscribeSystem = onValue(systemRef, (snapshot) => {
      const data = snapshot.val();
      setSystemData(data);
    });

    // Listen to control path
    const controlRef = ref(database, "/control");
    const unsubscribeControl = onValue(controlRef, (snapshot) => {
      const data = snapshot.val();
      setControlData(data);
    });

    // Listen to sensors path
    const sensorsRef = ref(database, "/sensors");
    const unsubscribeSensors = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      setSensorsData(data);
    });

    return () => {
      unsubscribeRoot();
      unsubscribeSystem();
      unsubscribeControl();
      unsubscribeSensors();
    };
  }, []);

  const formatJson = (data: any) => {
    if (!data) return "null";
    return JSON.stringify(data, null, 2);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Firebase Database Debugger
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">System Data (/system)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontSize: "0.7rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              {formatJson(systemData)}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Control Data (/control)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontSize: "0.7rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              {formatJson(controlData)}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Sensors Data (/sensors)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontSize: "0.7rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              {formatJson(sensorsData)}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Full Database (/)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontSize: "0.7rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              {formatJson(firebaseData)}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default FirebaseDebugger;
