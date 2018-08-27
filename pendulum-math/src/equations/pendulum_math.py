#!/usr/bin/env python3
from sympy import *

def printJS(name, exp):
    import re
    s = str(exp)
    s = re.sub(r"\(t\)", "", s)
    s = re.sub(r"Derivative\(theta([0-9]), t\)", r"theta\1Dot", s)
    s = re.sub(r"Derivative\(theta([0-9]), \(t, 2\)\)", r"theta\1DotDot", s)
    s = re.sub(r"theta", "\u03B8", s)
    name = re.sub(r"theta", "\u03B8", name)
    print('const ' + name + ' = ')
    print(s)

(t, g) = symbols('t, g') # time, gravity
(L1, L2) = symbols('L1:3') # lengths of bars
(m1, m2) = symbols('m1:3') # point masses
(a1, a2) = symbols('a1:3') # base basis
(T1, T2) = symbols('T1:3') # tensions

# angles
theta1 = Function('theta1')(t)
theta2 = Function('theta2')(t)

# basis at each joint
b1 = Function('b1')(t)
b2 = Function('b2')(t)
c1 = Function('c1')(t)
c2 = Function('c2')(t)

# conversion between basis
b1aexp = a1 * cos(theta1) + a2 * sin(theta1)
b2aexp = -a1 * sin(theta1) + a2 * cos(theta1)
c1bexp = b1 * cos(theta2) + b2 * sin(theta2)
c2bexp = -b1 * sin(theta2) + b2 * cos(theta2)
c1aexp = c1bexp.subs([(b1, b1aexp), (b2, b2aexp)])
c2aexp = c2bexp.subs([(b1, b1aexp), (b2, b2aexp)])

# kinematics for point Q (tip of the single pendulum)
posQ = L1 * b1
velQ = diff(posQ, t)
accelQ = diff(velQ, t)

# kinematics for point R (tip of the double pendulum)
posR = posQ + L2 * c1
velR = diff(posR, t)
accelR = diff(velR, t)

# F=ma for point R and Q
eq1 = Eq(m2 * accelR, m2 * g * a1 - T2 * c1)
eq2 = Eq(m1 * accelQ, m1 * g * a1 - T1 * b1 + T2 * c1)

# convert from basis b and c to basis a, and execute derivatives
eq1 = eq1.subs([
    (b1, b1aexp),
    (b2, b2aexp),
    (c1, c1aexp),
    (c2, c2aexp),
]).doit()
eq2 = eq2.subs([
    (b1, b1aexp),
    (b2, b2aexp),
    (c1, c1aexp),
    (c2, c2aexp),
]).doit()

# expand to 4 equations for each basis (dot each with a1 and a2)
eq3 = eq1.subs([(a1, 0), (a2, 1)]).simplify();
eq4 = eq1.subs([(a1, 1), (a2, 0)]).simplify();
eq5 = eq2.subs([(a1, 0), (a2, 1)]).simplify();
eq6 = eq2.subs([(a1, 1), (a2, 0)]).simplify();

# solve for T2 and theta2DotDot in terms of theta1DotDot
res = solve(
    [eq3, eq4],
    T2,
    Derivative(theta2, (t, 2)),
)
theta2DotDot = res[Derivative(theta2, (t, 2))]

# solve for theta1DotDot
theta1DotDot = solve(
    [Eq(theta2DotDot, Derivative(theta2, (t, 2))), Eq(T2, res[T2]), eq5, eq6],
    T1,
    T2,
    Derivative(theta1, (t, 2)),
    Derivative(theta2, (t, 2)),
)[Derivative(theta1, (t, 2))]

printJS('theta1DotDot', theta1DotDot)
printJS('theta2DotDot', theta2DotDot)
