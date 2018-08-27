f=$(mktemp).js

echo 'deriving...'

python src/equations/pendulum_math.py > $f

echo 'result:'

# python allows -x**y, but in JS that needs to be written -(x**y) or (-x)**y
# so try to convert those cases first
perl -i -pe 's/-[ ]?([θ\w]+) \*\* (\w+)/-\($1 ** $2)/g' $f

# attempt to parse python as if it were javascript
yarn prettier $f --print-width=75 --write
cat $f

echo 'const {sin, cos} = Math; const g = 9.8;' > src/ui/calcThetaDotDots.js
echo 'function calcThetaDotDots({ θ1, θ2, θ1Dot, θ2Dot }, { L1, L2, m1, m2 }) {' >> src/ui/calcThetaDotDots.js
cat $f >> src/ui/calcThetaDotDots.js
echo 'return { θ1DotDot, θ2DotDot }; }' >> src/ui/calcThetaDotDots.js

# browser doesn't like unicode :(
perl -i -pe 's/θ/theta/g' src/ui/calcThetaDotDots.js

yarn prettier src/ui/calcThetaDotDots.js --print-width=75 --write

echo 'wrote result to src/ui/calcThetaDotDots.js'

rm $f
