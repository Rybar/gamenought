// Based on an original effect by joltz0r and Altered

precision mediump float;

uniform float   time;
uniform vec2    resolution;
uniform vec3    color;

void main() {

    vec2 p = gl_FragCoord.xy / resolution * 10.0 -vec2(19.0);
    vec2 i = p;
    float c = 1.0;
    float inten = .05;

    for (int n = 0; n < 8; n++) 
    {
        float t = time * (0.7 - (0.2 / float(n+1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0 / length(vec2(p.x / (2.0 * sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
    }

    c /= float(8);
    c = 1.5 - sqrt(pow(c, 2.0));
    gl_FragColor = vec4(color * c * c * c * c, 1.0);

}