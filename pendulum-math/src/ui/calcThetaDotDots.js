const { sin, cos } = Math;
const g = 9.8;
function calcThetaDotDots(
  { theta1, theta2, theta1Dot, theta2Dot },
  { L1, L2, m1, m2 }
) {
  const theta1DotDot =
    ((L1 * m1 * sin(2 * theta1) * theta1Dot ** 2) / 2 -
      m1 * (L1 * cos(theta1) * theta1Dot ** 2 + g) * sin(theta1) +
      m2 *
        (L1 * cos(theta2) * theta1Dot ** 2 +
          L2 * theta1Dot ** 2 +
          2 * L2 * theta1Dot * theta2Dot +
          L2 * theta2Dot ** 2 +
          g * cos(theta1 + theta2)) *
        sin(theta2)) /
    (L1 * (m1 + m2 * sin(theta2) ** 2));
  const theta2DotDot =
    -(
      L1 * sin(theta2) * theta1Dot ** 2 +
      L1 * cos(theta2) * theta1DotDot +
      L2 * theta1DotDot +
      g * sin(theta1 + theta2)
    ) / L2;
  return { theta1DotDot, theta2DotDot };
}
