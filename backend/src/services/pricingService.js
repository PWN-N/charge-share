const GST_RATE = 0.18;

function calculatePricing({
  batteryCapacityKwh,
  currentBatteryPercent,
  targetBatteryPercent,
  ratePerKwh,
  rescueMode,
  distanceKm = 0,
  baseMobilizationFee = 0,
  perKmRate = 0,
  urgencyMultiplier = 1,
  commissionRate = 0.10,
}) {
  const numericValues = [
    batteryCapacityKwh,
    currentBatteryPercent,
    targetBatteryPercent,
    ratePerKwh,
    distanceKm,
    baseMobilizationFee,
    perKmRate,
    urgencyMultiplier,
    commissionRate,
  ];

  if (!numericValues.every(Number.isFinite)) {
    throw new Error("All pricing inputs must be finite numbers");
  }

  if (batteryCapacityKwh <= 0) {
    throw new Error("Battery capacity must be positive");
  }

  if (
    currentBatteryPercent < 0 ||
    currentBatteryPercent > 100 ||
    targetBatteryPercent < 0 ||
    targetBatteryPercent > 100 ||
    targetBatteryPercent <= currentBatteryPercent
  ) {
    throw new Error("Invalid battery percentage range");
  }

  if (
    ratePerKwh < 0 ||
    distanceKm < 0 ||
    baseMobilizationFee < 0 ||
    perKmRate < 0 ||
    urgencyMultiplier < 1 ||
    commissionRate < 0 ||
    commissionRate > 1
  ) {
    throw new Error("Invalid pricing rates");
  }

  if (!["SELF_DRIVE", "PROVIDER_DISPATCH"].includes(rescueMode)) {
    throw new Error("Invalid rescue mode");
  }

  const requiredEnergyKwh =
    (batteryCapacityKwh *
      (targetBatteryPercent - currentBatteryPercent)) /
    100;

  const energyCharges = requiredEnergyKwh * ratePerKwh;

  const mobilizationFee =
    rescueMode === "PROVIDER_DISPATCH"
      ? baseMobilizationFee + distanceKm * perKmRate
      : 0;

  const serviceValue =
    (energyCharges + mobilizationFee) * urgencyMultiplier;

  const platformCommission = serviceValue * commissionRate;
  const gst = platformCommission * GST_RATE;

  const totalPayable =
    serviceValue + platformCommission + gst;

  const providerPayout = serviceValue;

  const round2 = (value) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

  return {
    currency: "INR",

    requiredEnergyKwh: round2(requiredEnergyKwh),

    pricing: {
      energyCharges: round2(energyCharges),
      baseMobilizationFee: round2(
        rescueMode === "PROVIDER_DISPATCH"
          ? baseMobilizationFee
          : 0
      ),
      travelDistanceKm: round2(
        rescueMode === "PROVIDER_DISPATCH" ? distanceKm : 0
      ),
      travelCharges: round2(
        rescueMode === "PROVIDER_DISPATCH"
          ? distanceKm * perKmRate
          : 0
      ),
      urgencyMultiplier,
      serviceValue: round2(serviceValue),
      platformCommission: round2(platformCommission),
      gstRate: GST_RATE,
      gst: round2(gst),
      totalPayable: round2(totalPayable),
      providerPayout: round2(providerPayout),
    },
  };
}

module.exports = { calculatePricing };