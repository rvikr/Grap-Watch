package com.grapwatch;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class AQIPollWorkerTest {

    @Test
    public void testGetStageNumber() {
        // Stage 0: AQI <= 200
        assertEquals(0, AQIPollWorker.getStageNumber(0));
        assertEquals(0, AQIPollWorker.getStageNumber(100));
        assertEquals(0, AQIPollWorker.getStageNumber(200));

        // Stage 1: 200 < AQI <= 300
        assertEquals(1, AQIPollWorker.getStageNumber(201));
        assertEquals(1, AQIPollWorker.getStageNumber(250));
        assertEquals(1, AQIPollWorker.getStageNumber(300));

        // Stage 2: 300 < AQI <= 400
        assertEquals(2, AQIPollWorker.getStageNumber(301));
        assertEquals(2, AQIPollWorker.getStageNumber(350));
        assertEquals(2, AQIPollWorker.getStageNumber(400));

        // Stage 3: 400 < AQI <= 450
        assertEquals(3, AQIPollWorker.getStageNumber(401));
        assertEquals(3, AQIPollWorker.getStageNumber(440));
        assertEquals(3, AQIPollWorker.getStageNumber(450));

        // Stage 4: AQI > 450
        assertEquals(4, AQIPollWorker.getStageNumber(451));
        assertEquals(4, AQIPollWorker.getStageNumber(500));
    }

    private JSONObject createVehicle(String name, String fuelType, String emissionStd) throws JSONException {
        JSONObject json = new JSONObject();
        json.put("name", name);
        json.put("fuelType", fuelType);
        json.put("emissionStd", emissionStd);
        return json;
    }

    @Test
    public void testIsVehicleBannedInJava_Electric() throws JSONException {
        JSONObject electricVehicle1 = createVehicle("Tesla", "electric", "electric");
        JSONObject electricVehicle2 = createVehicle("Nexon EV", "electric", "BS-VI");
        JSONObject electricVehicle3 = createVehicle("ZS EV", "hybrid", "electric");

        for (int stage = 0; stage <= 4; stage++) {
            assertFalse(AQIPollWorker.isVehicleBannedInJava(electricVehicle1, stage));
            assertFalse(AQIPollWorker.isVehicleBannedInJava(electricVehicle2, stage));
            assertFalse(AQIPollWorker.isVehicleBannedInJava(electricVehicle3, stage));
        }
    }

    @Test
    public void testIsVehicleBannedInJava_Petrol() throws JSONException {
        JSONObject petrolBS3 = createVehicle("Old Swift", "petrol", "BS-III");
        JSONObject petrolBS4 = createVehicle("Swift", "petrol", "BS-IV");
        JSONObject petrolBS6 = createVehicle("New Swift", "petrol", "BS-VI");

        // Stage 0, 1, 2
        for (int stage = 0; stage <= 2; stage++) {
            assertFalse(AQIPollWorker.isVehicleBannedInJava(petrolBS3, stage));
            assertFalse(AQIPollWorker.isVehicleBannedInJava(petrolBS4, stage));
            assertFalse(AQIPollWorker.isVehicleBannedInJava(petrolBS6, stage));
        }

        // Stage 3
        assertTrue(AQIPollWorker.isVehicleBannedInJava(petrolBS3, 3));
        assertFalse(AQIPollWorker.isVehicleBannedInJava(petrolBS4, 3));
        assertFalse(AQIPollWorker.isVehicleBannedInJava(petrolBS6, 3));

        // Stage 4
        assertTrue(AQIPollWorker.isVehicleBannedInJava(petrolBS3, 4));
        assertFalse(AQIPollWorker.isVehicleBannedInJava(petrolBS4, 4));
        assertFalse(AQIPollWorker.isVehicleBannedInJava(petrolBS6, 4));
    }

    @Test
    public void testIsVehicleBannedInJava_Diesel() throws JSONException {
        JSONObject dieselBS2 = createVehicle("Old Scorpio", "diesel", "BS-II");
        JSONObject dieselBS3 = createVehicle("Mid Scorpio", "diesel", "BS-III");
        JSONObject dieselBS4 = createVehicle("Scorpio Classic", "diesel", "BS-IV");
        JSONObject dieselBS6 = createVehicle("Scorpio N", "diesel", "BS-VI");

        // Stage 0, 1, 2
        for (int stage = 0; stage <= 2; stage++) {
            assertFalse(AQIPollWorker.isVehicleBannedInJava(dieselBS2, stage));
            assertFalse(AQIPollWorker.isVehicleBannedInJava(dieselBS3, stage));
            assertFalse(AQIPollWorker.isVehicleBannedInJava(dieselBS4, stage));
            assertFalse(AQIPollWorker.isVehicleBannedInJava(dieselBS6, stage));
        }

        // Stage 3: Petrol BS-III, Diesel BS-III & BS-IV banned
        assertFalse(AQIPollWorker.isVehicleBannedInJava(dieselBS2, 3)); // BS-II is not explicitly in Stage 3 rule (only BS-III, BS-IV)
        assertTrue(AQIPollWorker.isVehicleBannedInJava(dieselBS3, 3));
        assertTrue(AQIPollWorker.isVehicleBannedInJava(dieselBS4, 3));
        assertFalse(AQIPollWorker.isVehicleBannedInJava(dieselBS6, 3));

        // Stage 4: Petrol BS-III, Diesel BS-II, BS-III, BS-IV banned
        assertTrue(AQIPollWorker.isVehicleBannedInJava(dieselBS2, 4));
        assertTrue(AQIPollWorker.isVehicleBannedInJava(dieselBS3, 4));
        assertTrue(AQIPollWorker.isVehicleBannedInJava(dieselBS4, 4));
        assertFalse(AQIPollWorker.isVehicleBannedInJava(dieselBS6, 4));
    }
}
