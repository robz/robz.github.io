#!/usr/bin/env python3
from sympy import *

# time, gravity, length, mass, tension
(t, g, L, m, T) = symbols('t, g, L, m, T')
(a1, a2) = symbols('a1:3') # base basis

# angle
theta = Function('theta')(t)

# basis at joint
b1 = Function('b1')(t)
b2 = Function('b2')(t)

b1aexp = a1 * cos(theta) + a2 * sin(theta)
b2aexp = -a1 * sin(theta) + a2 * cos(theta)

aexps_from_bexps = solve([Eq(b1, b1aexp), Eq(b2, b2aexp)], a1, a2)
a1bexp, a2bexp = [aexps_from_bexps[a] for a in (a1, a2)]

### Single pendulum ###

# kinematics for point Q (tip of the single pendulum)
posQ = L * b1
velQ = diff(posQ, t)
accelQ = diff(velQ, t)
print(accelQ)

# initial equation for forces on point Q
forceQ = Eq(m * accelQ, (m * g * a1) - (T * b1))
print(forceQ)

# substitue b basis for a basis
forceQ = forceQ.subs([(b1, b1aexp), (b2, b2aexp)])
print(forceQ)

# take the derivative (with respect to t)
forceQ = forceQ.doit()
print(forceQ)

# substitute a basis for b basis
forceQ = forceQ.subs([(a1, a1bexp), (a2, a2bexp)])
print(forceQ)

# take the dot product with b2
forceQ = forceQ.subs([(b1, 0), (b2, 1)])
print(forceQ)

# solve for thetadotdot
thetaDotDot = solve(forceQ, Derivative(theta, (t, 2)))[0]
print(thetaDotDot)
